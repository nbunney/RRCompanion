# RRCompanion Scraping Deployment Status

## Current Issue: Missing EventBridge Permissions

The deployment is progressing well! IAM permissions are working, but the IAM
user `rrScraperLambda` needs **EventBridge (CloudWatch Events) permissions** for
the scheduled functions.

### Required IAM Permissions

The user needs to add the following AWS managed policy to their IAM user:

```
AmazonEventBridgeFullAccess
```

Or create a custom policy with these specific EventBridge permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "events:CreateRule",
        "events:DeleteRule",
        "events:DescribeRule",
        "events:EnableRule",
        "events:DisableRule",
        "events:PutRule",
        "events:PutTargets",
        "events:RemoveTargets",
        "events:ListTargetsByRule",
        "events:TagResource",
        "events:UntagResource"
      ],
      "Resource": "*"
    }
  ]
}
```

### Current IAM Policies (Already Attached)

- ✅ `AmazonS3FullAccess` - AWS managed
- ✅ `AmazonSSMFullAccess` - AWS managed
- ✅ `AWSCloudFormationFullAccess` - AWS managed
- ✅ `AWSLambda_FullAccess` - AWS managed
- ✅ `IAMFullAccess` - AWS managed (NEW!)
- ❌ **Missing: EventBridge permissions**

### What Serverless Framework Needs EventBridge For

The Serverless Framework uses EventBridge to create scheduled triggers for
Lambda functions:

- Scheduled functions: `scrapeRisingStarsMain`, `scrapeRisingStarsAll`,
  `scrapeFictionHistory`
- These functions run on schedules (every 6-12 hours)
- EventBridge manages the cron-like scheduling

### Next Steps

1. **Add EventBridge permissions** to the `rrScraperLambda` IAM user
2. **Run deployment** again: `./deploy.sh dev`

## Project Status

✅ **Completed:**

- Serverless project structure created
- TypeScript compilation working
- ESBuild configuration resolved
- Region updated to `us-west-2`
- All scraping code removed from API
- Database service configured for AWS RDS
- SSM permissions resolved
- IAM permissions resolved
- AWS_REGION environment variable issue resolved

🔄 **In Progress:**

- AWS Lambda deployment (waiting for EventBridge permissions)

## Architecture Overview

The serverless scraping project includes:

- **Rising Stars Main**: Scrapes the main Rising Stars page (scheduled every 6
  hours)
- **Rising Stars All**: Scrapes all genre-specific Rising Stars pages (scheduled
  every 6 hours)
- **Fiction Details**: Scrapes individual fiction details (on-demand)
- **Fiction History**: Scrapes fiction history data (scheduled every 12 hours)
- **Batch Processing**: Handles Lambda timeout constraints
- **Database Integration**: Connects to existing MySQL RDS instance

All functions are configured with:

- 15-minute timeout (maximum Lambda limit)
- 2GB memory for optimal performance
- Proper error handling and logging
- Graceful timeout management
