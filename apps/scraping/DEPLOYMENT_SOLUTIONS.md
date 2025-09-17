# Serverless Scraping - Deployment Issues & Solutions

## ⚠️ **Current Deployment Issues**

The deployment is failing due to AWS IAM permission limitations for the
`rrScraperLambda` user. The user lacks permissions for:

1. **CloudFormation**: `cloudformation:DescribeStackResource`
2. **SSM**: `ssm:GetParameter` for deployment bucket
3. **S3**: Bucket creation and management

## 🔧 **Solutions**

### **Option 1: Update IAM Permissions (Recommended)**

Add the following policy to the `rrScraperLambda` user:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "lambda:*",
        "iam:*",
        "logs:*",
        "events:*",
        "s3:*",
        "ssm:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### **Option 2: Use Admin AWS Profile**

Temporarily use an admin AWS profile for deployment:

```bash
# Switch to admin profile
export AWS_PROFILE=admin-profile

# Deploy
./deploy.sh dev
```

### **Option 3: Manual S3 Bucket Creation**

Create the deployment bucket manually:

```bash
# Create S3 bucket
aws s3 mb s3://rrcompanion-scraping-deployments-dev --region us-east-1

# Then deploy
./deploy.sh dev
```

### **Option 4: Deploy with Different User**

Use a different AWS user with more permissions:

```bash
# Configure with different user
aws configure --profile scraping-deploy
export AWS_PROFILE=scraping-deploy

# Deploy
./deploy.sh dev
```

## 📋 **Current Project Status**

### ✅ **Technical Issues Resolved:**

- ESBuild configuration working
- TypeScript compilation successful
- All Lambda handlers ready
- Database integration configured
- Timeout management implemented

### ⚠️ **Only AWS Permissions Needed:**

The project is technically complete and ready for deployment. Only AWS IAM
permissions need to be updated.

## 🚀 **Lambda Functions Ready**

All 6 functions are ready for deployment:

1. **scrapeRisingStarsMain** - Main Rising Stars (6-hour schedule)
2. **scrapeRisingStarsAll** - All genres Rising Stars (6-hour schedule)
3. **scrapeFiction** - Individual fiction scraping (on-demand)
4. **scrapeFictionHistory** - Fiction statistics (12-hour schedule)
5. **scrapeCampaigns** - Campaign data (on-demand)
6. **scrapeRetention** - Retention analytics (on-demand)

## 🎯 **Next Steps**

1. **Choose one of the solutions above**
2. **Update AWS permissions or use admin profile**
3. **Run `./deploy.sh dev`**
4. **Configure environment variables**
5. **Test the deployed functions**

**The serverless scraping system is ready to replace the API scraping
functionality!**
