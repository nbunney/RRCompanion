# RRCompanion Serverless Scraping

This directory contains the serverless scraping functions for RRCompanion, built
using the Serverless Framework and deployed to AWS Lambda.

## Overview

The serverless scraping system is designed to handle various Royal Road scraping
tasks with proper timeout management and batch processing to work within
Lambda's 15-minute execution limit.

## Architecture

### Lambda Functions

1. **scrapeRisingStarsMain** - Scrapes the main Rising Stars page (scheduled
   every 6 hours)
2. **scrapeRisingStarsAll** - Scrapes Rising Stars for all genres (scheduled
   every 6 hours)
3. **scrapeFiction** - Scrapes individual fiction data (on-demand)
4. **scrapeFictionHistory** - Updates fiction statistics over time (scheduled
   every 12 hours)
5. **scrapeCampaigns** - Handles advertising campaign data (on-demand)
6. **scrapeRetention** - Handles retention analytics data (on-demand)

### Key Features

- **Timeout Management**: All functions include timeout detection and graceful
  shutdown
- **Batch Processing**: Large datasets are processed in configurable batches
- **Error Handling**: Comprehensive error handling with retry logic
- **Database Integration**: Direct MySQL connection to existing RRCompanion
  database
- **Rate Limiting**: Built-in delays to respect Royal Road's rate limits

## Setup

### Prerequisites

1. Node.js 20.x or later
2. AWS CLI configured with appropriate permissions
3. Serverless Framework installed globally: `npm install -g serverless`

### Installation

```bash
cd apps/scraping
npm install
```

### Environment Configuration

1. Copy `.env.example` to `.env`
2. Configure your database connection string
3. Set up AWS credentials

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Local Development

```bash
# Start offline development server
npm run offline

# Test individual functions
npm run invoke:local -- --function scrapeRisingStarsMain
```

## Deployment

### Development Deployment

```bash
npm run deploy:dev
```

### Production Deployment

```bash
npm run deploy:prod
```

### Environment Variables

Set environment variables in AWS Systems Manager Parameter Store:

```bash
# Example for production
aws ssm put-parameter \
  --name "/rrcompanion/prod/DATABASE_URL" \
  --value "mysql://user:pass@host:3306/db?ssl=true" \
  --type "SecureString"
```

## Lambda Configuration

### Timeout Settings

- **Maximum Timeout**: 900 seconds (15 minutes)
- **Memory Allocation**: 2048 MB for main functions, 1024 MB for individual
  scraping
- **Batch Size**: Configurable via environment variables

### Scheduled Functions

- Rising Stars scraping runs every 6 hours
- Fiction History updates run every 12 hours
- All schedules can be disabled by setting `enabled: false` in serverless.yml

## Monitoring

### CloudWatch Logs

```bash
# View logs for a specific function
npm run logs -- --function scrapeRisingStarsMain

# Follow logs in real-time
npm run logs -- --function scrapeRisingStarsMain --tail
```

### Metrics

Key metrics to monitor:

- Function duration
- Memory utilization
- Error rates
- Database connection timeouts

## Error Handling

### Retry Logic

- Network errors are automatically retried
- Database connection errors are handled gracefully
- Timeout detection prevents incomplete processing

### Common Issues

1. **Database Connection Timeouts**: Increase Lambda timeout or optimize queries
2. **Rate Limiting**: Increase REQUEST_DELAY environment variable
3. **Memory Issues**: Increase memory allocation in serverless.yml

## Cost Optimization

### Strategies

1. **Batch Processing**: Process multiple items per invocation
2. **Smart Scheduling**: Avoid overlapping executions
3. **Memory Tuning**: Right-size memory allocation
4. **Timeout Management**: Prevent unnecessary long-running functions

### Estimated Costs

- Rising Stars scraping: ~$5-10/month
- Fiction History updates: ~$3-5/month
- Individual scraping: Pay-per-use

## Security

### IAM Permissions

The functions require:

- RDS access for database operations
- S3 access for temporary storage (if needed)
- CloudWatch Logs for monitoring

### Network Security

- Database connections use SSL
- VPC configuration available for enhanced security
- No public internet access required for database

## Migration from Current System

### Phase 1: Parallel Operation

- Deploy serverless functions alongside existing API
- Run both systems in parallel for validation

### Phase 2: Gradual Migration

- Migrate Rising Stars scraping first
- Add fiction history updates
- Migrate individual scraping functions

### Phase 3: Full Migration

- Remove scraping code from main API
- Update frontend to use new endpoints
- Decommission old scraping infrastructure

## Troubleshooting

### Common Commands

```bash
# Check function status
serverless invoke --function scrapeRisingStarsMain

# View function configuration
serverless describe --function scrapeRisingStarsMain

# Remove all resources
npm run remove
```

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in environment variables.

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include timeout management
4. Test locally with `serverless offline`
5. Update documentation for new functions
