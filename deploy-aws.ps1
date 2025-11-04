# AWS Deployment Script for Scheduler App
# This script automates the deployment to AWS S3 and CloudFront

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$Profile = "default"
)

Write-Host "🚀 Starting AWS deployment for Scheduler App..." -ForegroundColor Green

# Step 1: Build the application
Write-Host "📦 Building React application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Step 2: Create S3 bucket (if it doesn't exist)
Write-Host "🪣 Creating S3 bucket: $BucketName" -ForegroundColor Yellow
aws s3 mb s3://$BucketName --region $Region --profile $Profile

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Bucket might already exist, continuing..." -ForegroundColor Yellow
}

# Step 3: Configure bucket for static website hosting
Write-Host "🌐 Configuring S3 for static website hosting..." -ForegroundColor Yellow
aws s3 website s3://$BucketName --index-document index.html --error-document index.html --profile $Profile

# Step 4: Set bucket policy for public read access
Write-Host "🔓 Setting bucket policy for public access..." -ForegroundColor Yellow
$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BucketName/*"
        }
    ]
}
"@

$bucketPolicy | Out-File -FilePath "bucket-policy.json" -Encoding UTF8
aws s3api put-bucket-policy --bucket $BucketName --policy file://bucket-policy.json --profile $Profile
Remove-Item "bucket-policy.json"

# Step 5: Upload files to S3
Write-Host "📤 Uploading files to S3..." -ForegroundColor Yellow
aws s3 sync build/ s3://$BucketName --delete --profile $Profile

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Files uploaded successfully!" -ForegroundColor Green

# Step 6: Get the website URL
$websiteUrl = "http://$BucketName.s3-website-$Region.amazonaws.com"
Write-Host "🌍 Your application is now live at: $websiteUrl" -ForegroundColor Green

# Step 7: Optional - Create CloudFront distribution
Write-Host "`n📡 To set up CloudFront for better performance and HTTPS:" -ForegroundColor Cyan
Write-Host "1. Go to AWS CloudFront console" -ForegroundColor White
Write-Host "2. Create a new distribution" -ForegroundColor White
Write-Host "3. Set origin domain to: $BucketName.s3.amazonaws.com" -ForegroundColor White
Write-Host "4. Set default root object to: index.html" -ForegroundColor White
Write-Host "5. Configure custom error pages (403, 404 -> /index.html)" -ForegroundColor White

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "Your Scheduler App is now hosted on AWS S3!" -ForegroundColor Green

