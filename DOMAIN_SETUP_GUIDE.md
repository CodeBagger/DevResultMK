# 🌐 Custom Domain Setup Guide

This guide will help you set up a custom domain with HTTPS and subdomain support for your Scheduler app.

## Prerequisites

- ✅ Domain name (e.g., `yourdomain.com`)
- ✅ AWS account with Route 53 access
- ✅ Existing S3 bucket and CloudFront distribution

## Step 1: Create Route 53 Hosted Zone

### Option A: Using AWS CLI
```bash
# Create hosted zone for your domain
aws route53 create-hosted-zone \
    --name yourdomain.com \
    --caller-reference $(date +%s) \
    --profile MikePersonal
```

### Option B: Using AWS Console
1. Go to [Route 53 Console](https://console.aws.amazon.com/route53/)
2. Click "Create hosted zone"
3. Enter your domain name (e.g., `yourdomain.com`)
4. Choose "Public hosted zone"
5. Click "Create hosted zone"

### Get Name Servers
After creating the hosted zone, note the 4 name servers (e.g., `ns-123.awsdns-12.com`)

## Step 2: Update Domain Registrar

1. **Go to your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Update nameservers** to the Route 53 nameservers:
   ```
   ns-123.awsdns-12.com
   ns-456.awsdns-45.net
   ns-789.awsdns-78.org
   ns-012.awsdns-01.co.uk
   ```
3. **Save changes** (propagation takes 24-48 hours)

## Step 3: Request SSL Certificate

### Using AWS CLI
```bash
# Request certificate for domain and wildcard subdomain
aws acm request-certificate \
    --domain-name yourdomain.com \
    --subject-alternative-names "*.yourdomain.com" \
    --validation-method DNS \
    --region us-east-1 \
    --profile MikePersonal
```

### Using AWS Console
1. Go to [Certificate Manager](https://console.aws.amazon.com/acm/)
2. Click "Request a certificate"
3. Choose "Request a public certificate"
4. Add domain names:
   - `yourdomain.com`
   - `*.yourdomain.com` (for subdomains)
5. Choose "DNS validation"
6. Click "Request"

## Step 4: Validate Certificate

1. **Get validation records** from Certificate Manager
2. **Create CNAME records** in Route 53:
   ```bash
   # Create validation record
   aws route53 change-resource-record-sets \
       --hosted-zone-id YOUR_HOSTED_ZONE_ID \
       --change-batch file://validation-record.json \
       --profile MikePersonal
   ```

3. **Wait for validation** (usually 5-30 minutes)

## Step 5: Create CloudFront Distribution

### Using AWS CLI
```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json \
    --profile MikePersonal
```

### Using AWS Console
1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Click "Create distribution"
3. Configure:
   - **Origin Domain**: `mikek-scheduler-app-2024.s3.amazonaws.com`
   - **Origin Path**: (leave empty)
   - **Default Root Object**: `index.html`
   - **Alternate Domain Names**: `scheduler.yourdomain.com`
   - **SSL Certificate**: Select your custom certificate
   - **Default Cache Behavior**: Redirect HTTP to HTTPS
   - **Error Pages**: 403, 404 → `/index.html` (200)

## Step 6: Configure DNS Records

### Create A Record for Subdomain
```bash
# Create A record pointing to CloudFront
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_HOSTED_ZONE_ID \
    --change-batch file://subdomain-record.json \
    --profile MikePersonal
```

### DNS Record Configuration
```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "scheduler.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "DNSName": "d1234567890.cloudfront.net",
          "EvaluateTargetHealth": false,
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
      }
    }
  ]
}
```

## Step 7: Optional - Root Domain Redirect

If you want `yourdomain.com` to redirect to `scheduler.yourdomain.com`:

1. **Create S3 bucket** for redirect: `yourdomain.com`
2. **Configure static website hosting** with redirect
3. **Create CloudFront distribution** for redirect
4. **Create A record** for root domain

## Step 8: Test Your Setup

1. **Wait for DNS propagation** (up to 48 hours)
2. **Test HTTPS access**: `https://scheduler.yourdomain.com`
3. **Check SSL certificate**: Should show as valid
4. **Test subdomain functionality**: Create additional subdomains

## Configuration Files

### CloudFront Configuration
```json
{
  "CallerReference": "scheduler-app-$(date +%s)",
  "Comment": "Scheduler App Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-mikek-scheduler-app-2024",
        "DomainName": "mikek-scheduler-app-2024.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-mikek-scheduler-app-2024",
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
    "Items": [
      "scheduler.yourdomain.com"
    ]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Enabled": true
}
```

## Cost Estimation

### Monthly Costs
- **Route 53 Hosted Zone**: $0.50
- **Route 53 Queries**: $0.40 per million queries
- **CloudFront**: $0.085 per GB (first 10TB)
- **SSL Certificate**: Free
- **S3**: $0.023 per GB

**Total Estimated Cost**: $1-5/month

## Troubleshooting

### Common Issues

1. **DNS not resolving**
   - Check nameserver configuration
   - Wait for propagation (up to 48 hours)

2. **SSL certificate not working**
   - Ensure certificate is in `us-east-1` region
   - Verify domain validation is complete

3. **CloudFront not updating**
   - Invalidate cache: `aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"`

4. **Subdomain not working**
   - Check wildcard certificate includes `*.yourdomain.com`
   - Verify DNS A record points to CloudFront

### Useful Commands

```bash
# Check DNS resolution
nslookup scheduler.yourdomain.com

# Test HTTPS
curl -I https://scheduler.yourdomain.com

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*" --profile MikePersonal
```

## Next Steps

1. **Set up monitoring** with CloudWatch
2. **Configure additional subdomains** as needed
3. **Set up email** (optional)
4. **Add analytics** (Google Analytics, etc.)
5. **Configure backup** and disaster recovery

Your custom domain with HTTPS and subdomain support will be ready! 🎉
