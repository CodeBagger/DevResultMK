# AWS Deployment Guide

This guide will help you deploy the Scheduler App to AWS using S3, CloudFront, and Route 53.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Domain name (optional, for custom domain)
- SSL certificate (handled by AWS Certificate Manager)

## Step 1: Build the Application

```bash
npm run build
```

This creates a `build` folder with all the static files.

## Step 2: Create S3 Bucket

1. **Create a new S3 bucket**:
   ```bash
   aws s3 mb s3://your-scheduler-app-bucket
   ```

2. **Configure bucket for static website hosting**:
   ```bash
   aws s3 website s3://your-scheduler-app-bucket --index-document index.html --error-document index.html
   ```

3. **Set bucket policy for public read access**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-scheduler-app-bucket/*"
       }
     ]
   }
   ```

## Step 3: Upload Files to S3

```bash
aws s3 sync build/ s3://your-scheduler-app-bucket --delete
```

## Step 4: Create CloudFront Distribution

1. **Go to CloudFront console**
2. **Create a new distribution**
3. **Configure origin**:
   - Origin Domain: Your S3 bucket
   - Origin Path: (leave empty)
   - Origin Access: Public

4. **Configure default cache behavior**:
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - Cache Policy: Managed-CachingDisabled (for SPA)

5. **Configure error pages**:
   - HTTP Error Code: 403, 404
   - Response Page Path: /index.html
   - HTTP Response Code: 200

## Step 5: Custom Domain (Optional)

1. **Request SSL certificate** in AWS Certificate Manager
2. **Create Route 53 hosted zone** for your domain
3. **Create A record** pointing to CloudFront distribution
4. **Update CloudFront distribution** with your custom domain

## Step 6: Environment Variables

For production deployment, you might want to set environment variables:

```bash
# In your build process
REACT_APP_ENVIRONMENT=production
```

## Step 7: Automated Deployment

Create a deployment script:

```bash
#!/bin/bash
# deploy.sh

# Build the application
npm run build

# Upload to S3
aws s3 sync build/ s3://your-scheduler-app-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "Deployment complete!"
```

## Cost Optimization

- **S3**: Very low cost for static files
- **CloudFront**: Pay per request (very affordable for small apps)
- **Route 53**: $0.50 per hosted zone per month
- **ACM**: Free SSL certificates

## Security Considerations

1. **S3 Bucket Policy**: Restrict access to CloudFront only
2. **CloudFront**: Use HTTPS only
3. **CORS**: Configure if needed for API calls
4. **Headers**: Add security headers in CloudFront

## Monitoring

- **CloudWatch**: Monitor CloudFront metrics
- **S3**: Monitor bucket metrics
- **Route 53**: Monitor DNS queries

## Backup Strategy

- **S3 Versioning**: Enable for file history
- **Cross-Region Replication**: For disaster recovery
- **Git**: Source code backup

## Performance Optimization

1. **CloudFront Caching**: Configure appropriate TTL
2. **Compression**: Enable Gzip compression
3. **HTTP/2**: Automatically enabled by CloudFront
4. **CDN**: Global edge locations for fast loading

## Troubleshooting

### Common Issues

1. **404 Errors**: Ensure error pages redirect to index.html
2. **CORS Issues**: Configure S3 CORS policy
3. **SSL Issues**: Verify certificate is valid
4. **Cache Issues**: Invalidate CloudFront cache

### Useful Commands

```bash
# Check S3 bucket contents
aws s3 ls s3://your-scheduler-app-bucket --recursive

# Test CloudFront distribution
curl -I https://your-domain.com

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Estimated Monthly Costs

For a small to medium application:
- **S3**: $1-5
- **CloudFront**: $1-10
- **Route 53**: $0.50
- **Total**: $2.50-15.50/month

This makes it very cost-effective for hosting a React application on AWS.

