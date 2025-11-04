# 🚀 AWS Deployment Guide for Scheduler App

This guide will help you deploy your React Scheduler App to AWS using S3 and CloudFront.

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws configure
   ```
   - Access Key ID
   - Secret Access Key
   - Default region (e.g., us-east-1)
   - Default output format (json)

2. **Node.js and npm** (already installed)

3. **Unique S3 bucket name** (must be globally unique)

## Quick Deployment (Automated)

### Option 1: PowerShell Script (Windows)
```powershell
.\deploy-aws.ps1 -BucketName "your-unique-scheduler-app" -Region "us-east-1"
```

### Option 2: Bash Script (Linux/Mac/WSL)
```bash
chmod +x deploy-aws.sh
./deploy-aws.sh your-unique-scheduler-app us-east-1
```

## Manual Deployment Steps

### Step 1: Build the Application
```bash
npm run build
```

### Step 2: Create S3 Bucket
```bash
aws s3 mb s3://your-unique-scheduler-app --region us-east-1
```

### Step 3: Configure Static Website Hosting
```bash
aws s3 website s3://your-unique-scheduler-app --index-document index.html --error-document index.html
```

### Step 4: Set Bucket Policy
Create `bucket-policy.json`:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-unique-scheduler-app/*"
        }
    ]
}
```

Apply the policy:
```bash
aws s3api put-bucket-policy --bucket your-unique-scheduler-app --policy file://bucket-policy.json
```

### Step 5: Upload Files
```bash
aws s3 sync build/ s3://your-unique-scheduler-app --delete
```

### Step 6: Access Your App
Your app will be available at:
```
http://your-unique-scheduler-app.s3-website-us-east-1.amazonaws.com
```

## Setting Up CloudFront (Recommended)

### Why CloudFront?
- **HTTPS/SSL** support
- **Global CDN** for faster loading
- **Custom domain** support
- **Better caching**

### CloudFront Setup Steps

1. **Go to CloudFront Console**
   - Navigate to AWS CloudFront in your AWS Console

2. **Create Distribution**
   - Click "Create Distribution"

3. **Configure Origin**
   - **Origin Domain**: `your-unique-scheduler-app.s3.amazonaws.com`
   - **Origin Path**: (leave empty)
   - **Origin Access**: Public

4. **Configure Default Cache Behavior**
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - **Cache Policy**: Managed-CachingDisabled (for SPA)

5. **Configure Error Pages**
   - **HTTP Error Code**: 403, 404
   - **Response Page Path**: `/index.html`
   - **HTTP Response Code**: 200

6. **Create Distribution**
   - Click "Create Distribution"
   - Wait for deployment (5-15 minutes)

## Custom Domain Setup (Optional)

### Step 1: Request SSL Certificate
1. Go to AWS Certificate Manager
2. Request a public certificate
3. Add your domain name
4. Validate domain ownership

### Step 2: Create Route 53 Hosted Zone
1. Go to Route 53
2. Create hosted zone for your domain
3. Note the name servers

### Step 3: Update Domain DNS
Update your domain's nameservers to the Route 53 nameservers

### Step 4: Create A Record
1. In Route 53, create an A record
2. Set it to alias to your CloudFront distribution
3. Enable IPv6 if desired

## Cost Estimation

### Monthly Costs (Small to Medium App)
- **S3 Storage**: $0.023/GB (very low)
- **S3 Requests**: $0.0004/1000 requests
- **CloudFront**: $0.085/GB (first 10TB)
- **Route 53**: $0.50/hosted zone
- **ACM**: Free SSL certificates

**Total Estimated Cost**: $2-15/month

## Troubleshooting

### Common Issues

1. **403 Forbidden Error**
   - Check bucket policy is correctly set
   - Ensure bucket is configured for website hosting

2. **404 Errors on Refresh**
   - Configure CloudFront error pages
   - Set 403/404 → /index.html

3. **CORS Issues**
   - Add CORS configuration to S3 bucket if needed

4. **SSL Certificate Issues**
   - Ensure certificate is in us-east-1 region
   - Verify domain validation

### Useful Commands

```bash
# Check S3 bucket contents
aws s3 ls s3://your-bucket-name --recursive

# Test website
curl -I http://your-bucket-name.s3-website-us-east-1.amazonaws.com

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Security Best Practices

1. **S3 Bucket Policy**: Restrict access to CloudFront only
2. **CloudFront**: Use HTTPS only
3. **Headers**: Add security headers in CloudFront
4. **Monitoring**: Set up CloudWatch alarms

## Performance Optimization

1. **Compression**: Enable Gzip in CloudFront
2. **Caching**: Configure appropriate TTL
3. **HTTP/2**: Automatically enabled by CloudFront
4. **Edge Locations**: Global distribution

## Monitoring and Maintenance

1. **CloudWatch**: Monitor metrics
2. **Cost Monitoring**: Set up billing alerts
3. **Backup**: Enable S3 versioning
4. **Updates**: Regular dependency updates

## Next Steps

1. **Set up monitoring** with CloudWatch
2. **Configure backups** with S3 versioning
3. **Set up CI/CD** with GitHub Actions
4. **Add custom domain** for branding
5. **Implement analytics** (Google Analytics, etc.)

Your Scheduler App is now ready for production use on AWS! 🎉




