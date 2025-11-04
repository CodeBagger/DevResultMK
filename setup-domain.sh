#!/bin/bash

# Custom Domain Setup Script for Scheduler App
# Usage: ./setup-domain.sh <domain> <subdomain> [profile] [region]

set -e

DOMAIN_NAME=$1
SUBDOMAIN=$2
PROFILE=${3:-MikePersonal}
REGION=${4:-us-east-1}
FULL_DOMAIN="$SUBDOMAIN.$DOMAIN_NAME"
BUCKET_NAME="mikek-scheduler-app-2024"

if [ -z "$DOMAIN_NAME" ] || [ -z "$SUBDOMAIN" ]; then
    echo "❌ Error: Domain name and subdomain are required"
    echo "Usage: ./setup-domain.sh <domain> <subdomain> [profile] [region]"
    echo "Example: ./setup-domain.sh yourdomain.com scheduler MikePersonal us-east-1"
    exit 1
fi

echo "🌐 Setting up custom domain: $FULL_DOMAIN"

# Step 1: Create Route 53 Hosted Zone
echo "📡 Creating Route 53 hosted zone for $DOMAIN_NAME..."
HOSTED_ZONE=$(aws route53 create-hosted-zone \
    --name "$DOMAIN_NAME" \
    --caller-reference "$(date +%s)" \
    --profile "$PROFILE" \
    --output json)

if [ $? -ne 0 ]; then
    echo "❌ Failed to create hosted zone!"
    exit 1
fi

HOSTED_ZONE_ID=$(echo "$HOSTED_ZONE" | jq -r '.HostedZone.Id' | sed 's|/hostedzone/||')
NAME_SERVERS=$(echo "$HOSTED_ZONE" | jq -r '.DelegationSet.NameServers[]')

echo "✅ Hosted zone created: $HOSTED_ZONE_ID"
echo "📋 Name servers to configure at your registrar:"
echo "$NAME_SERVERS" | while read -r ns; do
    echo "   $ns"
done

# Step 2: Request SSL Certificate
echo "🔒 Requesting SSL certificate for $DOMAIN_NAME and *.$DOMAIN_NAME..."
CERTIFICATE=$(aws acm request-certificate \
    --domain-name "$DOMAIN_NAME" \
    --subject-alternative-names "*.$DOMAIN_NAME" \
    --validation-method DNS \
    --region "$REGION" \
    --profile "$PROFILE" \
    --output json)

if [ $? -ne 0 ]; then
    echo "❌ Failed to request certificate!"
    exit 1
fi

CERTIFICATE_ARN=$(echo "$CERTIFICATE" | jq -r '.CertificateArn')
echo "✅ Certificate requested: $CERTIFICATE_ARN"

# Step 3: Get certificate validation records
echo "⏳ Waiting for certificate validation records..."
sleep 10

VALIDATION_RECORDS=$(aws acm describe-certificate \
    --certificate-arn "$CERTIFICATE_ARN" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --output json)

# Step 4: Create validation DNS records
echo "$VALIDATION_RECORDS" | jq -r '.Certificate.DomainValidationOptions[] | select(.ValidationStatus == "PENDING_VALIDATION") | .ResourceRecord' | while read -r record; do
    if [ -n "$record" ]; then
        NAME=$(echo "$record" | jq -r '.Name')
        TYPE=$(echo "$record" | jq -r '.Type')
        VALUE=$(echo "$record" | jq -r '.Value')
        
        cat > validation-record.json << EOF
{
    "Changes": [
        {
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "$NAME",
                "Type": "$TYPE",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$VALUE"
                    }
                ]
            }
        }
    ]
}
EOF
        
        aws route53 change-resource-record-sets \
            --hosted-zone-id "$HOSTED_ZONE_ID" \
            --change-batch file://validation-record.json \
            --profile "$PROFILE"
        
        if [ $? -eq 0 ]; then
            echo "✅ Validation record created for $NAME"
        else
            echo "❌ Failed to create validation record for $NAME"
        fi
        
        rm -f validation-record.json
    fi
done

echo "⏳ Waiting for certificate validation (this may take 5-30 minutes)..."
echo "💡 You can check validation status in AWS Certificate Manager console"

# Step 5: Create CloudFront distribution
echo "☁️ Creating CloudFront distribution..."

cat > cloudfront-config.json << EOF
{
    "CallerReference": "scheduler-app-$(date +%s)",
    "Comment": "Scheduler App Distribution for $FULL_DOMAIN",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_NAME.s3.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "Aliases": {
        "Quantity": 1,
        "Items": ["$FULL_DOMAIN"]
    },
    "ViewerCertificate": {
        "ACMCertificateArn": "$CERTIFICATE_ARN",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "Enabled": true
}
EOF

DISTRIBUTION=$(aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json \
    --profile "$PROFILE" \
    --output json)

if [ $? -ne 0 ]; then
    echo "❌ Failed to create CloudFront distribution!"
    exit 1
fi

DISTRIBUTION_ID=$(echo "$DISTRIBUTION" | jq -r '.Distribution.Id')
DISTRIBUTION_DOMAIN=$(echo "$DISTRIBUTION" | jq -r '.Distribution.DomainName')

echo "✅ CloudFront distribution created: $DISTRIBUTION_ID"
echo "🌍 Distribution domain: $DISTRIBUTION_DOMAIN"

# Step 6: Create DNS A record
echo "🔗 Creating DNS A record for $FULL_DOMAIN..."

cat > dns-record.json << EOF
{
    "Changes": [
        {
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "$FULL_DOMAIN",
                "Type": "A",
                "AliasTarget": {
                    "DNSName": "$DISTRIBUTION_DOMAIN",
                    "EvaluateTargetHealth": false,
                    "HostedZoneId": "Z2FDTNDATAQYW2"
                }
            }
        }
    ]
}
EOF

aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch file://dns-record.json \
    --profile "$PROFILE"

if [ $? -eq 0 ]; then
    echo "✅ DNS A record created for $FULL_DOMAIN"
else
    echo "❌ Failed to create DNS A record!"
fi

# Cleanup
rm -f cloudfront-config.json dns-record.json

echo ""
echo "🎉 Domain setup completed!"
echo "📋 Next steps:"
echo "1. Update your domain registrar with these name servers:"
echo "$NAME_SERVERS" | while read -r ns; do
    echo "   $ns"
done
echo "2. Wait for DNS propagation (up to 48 hours)"
echo "3. Wait for SSL certificate validation (5-30 minutes)"
echo "4. Test your site: https://$FULL_DOMAIN"
echo ""
echo "📊 Resources created:"
echo "• Route 53 Hosted Zone: $HOSTED_ZONE_ID"
echo "• SSL Certificate: $CERTIFICATE_ARN"
echo "• CloudFront Distribution: $DISTRIBUTION_ID"
echo "• DNS A Record: $FULL_DOMAIN → $DISTRIBUTION_DOMAIN"




