# 🚀 Quick Domain Setup Guide

## Prerequisites
- ✅ Domain name (e.g., `yourdomain.com`)
- ✅ Domain registrar access (GoDaddy, Namecheap, etc.)
- ✅ AWS CLI configured

## Option 1: Automated Setup (Recommended)

### Using PowerShell (Windows)
```powershell
.\setup-domain.ps1 -DomainName "yourdomain.com" -Subdomain "scheduler"
```

### Using Bash (Linux/Mac/WSL)
```bash
chmod +x setup-domain.sh
./setup-domain.sh yourdomain.com scheduler
```

## Option 2: Manual Setup

### Step 1: Create Route 53 Hosted Zone
```bash
aws route53 create-hosted-zone \
    --name yourdomain.com \
    --caller-reference $(date +%s) \
    --profile MikePersonal
```

### Step 2: Request SSL Certificate
```bash
aws acm request-certificate \
    --domain-name yourdomain.com \
    --subject-alternative-names "*.yourdomain.com" \
    --validation-method DNS \
    --region us-east-1 \
    --profile MikePersonal
```

### Step 3: Update Domain Registrar
1. Go to your domain registrar
2. Update nameservers to the Route 53 nameservers
3. Wait for propagation (24-48 hours)

### Step 4: Create CloudFront Distribution
1. Go to CloudFront console
2. Create distribution with:
   - Origin: `mikek-scheduler-app-2024.s3.amazonaws.com`
   - Alternate domain: `scheduler.yourdomain.com`
   - SSL certificate: Your custom certificate
   - Error pages: 403, 404 → `/index.html`

### Step 5: Create DNS A Record
```bash
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_HOSTED_ZONE_ID \
    --change-batch file://dns-record.json \
    --profile MikePersonal
```

## What You'll Get

✅ **Custom Domain**: `https://scheduler.yourdomain.com`
✅ **HTTPS/SSL**: Secure encrypted connection
✅ **Subdomain Support**: `*.yourdomain.com` wildcard
✅ **Global CDN**: Fast loading worldwide
✅ **Professional URL**: No more AWS URLs

## Cost Breakdown

- **Route 53**: $0.50/month + $0.40/million queries
- **SSL Certificate**: Free
- **CloudFront**: $0.085/GB
- **Total**: ~$1-3/month

## Timeline

1. **Setup**: 15-30 minutes
2. **DNS Propagation**: 24-48 hours
3. **SSL Validation**: 5-30 minutes
4. **Total**: 24-48 hours for full activation

## Testing

Once setup is complete:
1. Visit `https://scheduler.yourdomain.com`
2. Check SSL certificate is valid
3. Test creating events
4. Verify events save to Supabase

## Troubleshooting

### DNS not resolving
- Check nameserver configuration
- Wait for propagation

### SSL not working
- Ensure certificate is in `us-east-1`
- Verify domain validation

### CloudFront issues
- Check distribution status
- Invalidate cache if needed

## Next Steps

1. **Set up additional subdomains** (e.g., `admin.yourdomain.com`)
2. **Configure email** (optional)
3. **Add monitoring** with CloudWatch
4. **Set up backups** and disaster recovery

Your professional domain with HTTPS will be ready! 🎉




