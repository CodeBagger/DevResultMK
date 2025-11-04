# Custom Domain Setup Script for Scheduler App
# This script automates the domain setup process

param(
    [Parameter(Mandatory=$true)]
    [string]$DomainName,
    
    [Parameter(Mandatory=$true)]
    [string]$Subdomain,
    
    [Parameter(Mandatory=$false)]
    [string]$Profile = "MikePersonal",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

$FullDomain = "$Subdomain.$DomainName"
$BucketName = "mikek-scheduler-app-2024"

Write-Host "🌐 Setting up custom domain: $FullDomain" -ForegroundColor Green

# Step 1: Create Route 53 Hosted Zone
Write-Host "📡 Creating Route 53 hosted zone for $DomainName..." -ForegroundColor Yellow
$HostedZone = aws route53 create-hosted-zone --name $DomainName --caller-reference $(Get-Date -Format "yyyyMMddHHmmss") --profile $Profile --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create hosted zone!" -ForegroundColor Red
    exit 1
}

$HostedZoneId = ($HostedZone | ConvertFrom-Json).HostedZone.Id -replace "/hostedzone/", ""
$NameServers = ($HostedZone | ConvertFrom-Json).DelegationSet.NameServers

Write-Host "✅ Hosted zone created: $HostedZoneId" -ForegroundColor Green
Write-Host "📋 Name servers to configure at your registrar:" -ForegroundColor Cyan
foreach ($ns in $NameServers) {
    Write-Host "   $ns" -ForegroundColor White
}

# Step 2: Request SSL Certificate
Write-Host "🔒 Requesting SSL certificate for $DomainName and *.$DomainName..." -ForegroundColor Yellow
$Certificate = aws acm request-certificate --domain-name $DomainName --subject-alternative-names "*.$DomainName" --validation-method DNS --region $Region --profile $Profile --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to request certificate!" -ForegroundColor Red
    exit 1
}

$CertificateArn = ($Certificate | ConvertFrom-Json).CertificateArn
Write-Host "✅ Certificate requested: $CertificateArn" -ForegroundColor Green

# Step 3: Get certificate validation records
Write-Host "⏳ Waiting for certificate validation records..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

$ValidationRecords = aws acm describe-certificate --certificate-arn $CertificateArn --region $Region --profile $Profile --output json
$ValidationOptions = ($ValidationRecords | ConvertFrom-Json).Certificate.DomainValidationOptions

# Step 4: Create validation DNS records
foreach ($option in $ValidationOptions) {
    if ($option.ValidationStatus -eq "PENDING_VALIDATION") {
        $DomainName = $option.DomainName
        $ResourceRecord = $option.ResourceRecord
        
        $ChangeBatch = @{
            Changes = @(
                @{
                    Action = "CREATE"
                    ResourceRecordSet = @{
                        Name = $ResourceRecord.Name
                        Type = $ResourceRecord.Type
                        TTL = 300
                        ResourceRecords = @(
                            @{
                                Value = $ResourceRecord.Value
                            }
                        )
                    }
                }
            )
        } | ConvertTo-Json -Depth 10
        
        $ChangeBatch | Out-File -FilePath "validation-record.json" -Encoding UTF8
        
        aws route53 change-resource-record-sets --hosted-zone-id $HostedZoneId --change-batch file://validation-record.json --profile $Profile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Validation record created for $DomainName" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create validation record for $DomainName" -ForegroundColor Red
        }
        
        Remove-Item "validation-record.json" -ErrorAction SilentlyContinue
    }
}

Write-Host "⏳ Waiting for certificate validation (this may take 5-30 minutes)..." -ForegroundColor Yellow
Write-Host "💡 You can check validation status in AWS Certificate Manager console" -ForegroundColor Cyan

# Step 5: Create CloudFront distribution
Write-Host "☁️ Creating CloudFront distribution..." -ForegroundColor Yellow

$DistributionConfig = @{
    CallerReference = "scheduler-app-$(Get-Date -Format 'yyyyMMddHHmmss')"
    Comment = "Scheduler App Distribution for $FullDomain"
    DefaultRootObject = "index.html"
    Origins = @{
        Quantity = 1
        Items = @(
            @{
                Id = "S3-$BucketName"
                DomainName = "$BucketName.s3.amazonaws.com"
                S3OriginConfig = @{
                    OriginAccessIdentity = ""
                }
            }
        )
    }
    DefaultCacheBehavior = @{
        TargetOriginId = "S3-$BucketName"
        ViewerProtocolPolicy = "redirect-to-https"
        TrustedSigners = @{
            Enabled = $false
            Quantity = 0
        }
        ForwardedValues = @{
            QueryString = $false
            Cookies = @{
                Forward = "none"
            }
        }
        MinTTL = 0
        DefaultTTL = 86400
        MaxTTL = 31536000
    }
    CustomErrorResponses = @{
        Quantity = 2
        Items = @(
            @{
                ErrorCode = 403
                ResponsePagePath = "/index.html"
                ResponseCode = "200"
                ErrorCachingMinTTL = 300
            }
            @{
                ErrorCode = 404
                ResponsePagePath = "/index.html"
                ResponseCode = "200"
                ErrorCachingMinTTL = 300
            }
        )
    }
    Aliases = @{
        Quantity = 1
        Items = @($FullDomain)
    }
    ViewerCertificate = @{
        ACMCertificateArn = $CertificateArn
        SSLSupportMethod = "sni-only"
        MinimumProtocolVersion = "TLSv1.2_2021"
    }
    Enabled = $true
} | ConvertTo-Json -Depth 10

$DistributionConfig | Out-File -FilePath "cloudfront-config.json" -Encoding UTF8

$Distribution = aws cloudfront create-distribution --distribution-config file://cloudfront-config.json --profile $Profile --output json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create CloudFront distribution!" -ForegroundColor Red
    exit 1
}

$DistributionId = ($Distribution | ConvertFrom-Json).Distribution.Id
$DistributionDomain = ($Distribution | ConvertFrom-Json).Distribution.DomainName

Write-Host "✅ CloudFront distribution created: $DistributionId" -ForegroundColor Green
Write-Host "🌍 Distribution domain: $DistributionDomain" -ForegroundColor Cyan

# Step 6: Create DNS A record
Write-Host "🔗 Creating DNS A record for $FullDomain..." -ForegroundColor Yellow

$DNSRecord = @{
    Changes = @(
        @{
            Action = "CREATE"
            ResourceRecordSet = @{
                Name = $FullDomain
                Type = "A"
                AliasTarget = @{
                    DNSName = $DistributionDomain
                    EvaluateTargetHealth = $false
                    HostedZoneId = "Z2FDTNDATAQYW2"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10

$DNSRecord | Out-File -FilePath "dns-record.json" -Encoding UTF8

aws route53 change-resource-record-sets --hosted-zone-id $HostedZoneId --change-batch file://dns-record.json --profile $Profile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ DNS A record created for $FullDomain" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create DNS A record!" -ForegroundColor Red
}

# Cleanup
Remove-Item "cloudfront-config.json" -ErrorAction SilentlyContinue
Remove-Item "dns-record.json" -ErrorAction SilentlyContinue

Write-Host "`n🎉 Domain setup completed!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your domain registrar with these name servers:" -ForegroundColor White
foreach ($ns in $NameServers) {
    Write-Host "   $ns" -ForegroundColor White
}
Write-Host "2. Wait for DNS propagation (up to 48 hours)" -ForegroundColor White
Write-Host "3. Wait for SSL certificate validation (5-30 minutes)" -ForegroundColor White
Write-Host "4. Test your site: https://$FullDomain" -ForegroundColor White
Write-Host "`n📊 Resources created:" -ForegroundColor Cyan
Write-Host "• Route 53 Hosted Zone: $HostedZoneId" -ForegroundColor White
Write-Host "• SSL Certificate: $CertificateArn" -ForegroundColor White
Write-Host "• CloudFront Distribution: $DistributionId" -ForegroundColor White
Write-Host "• DNS A Record: $FullDomain → $DistributionDomain" -ForegroundColor White




