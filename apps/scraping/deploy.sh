#!/bin/bash

# RRCompanion Serverless Scraping Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "serverless.yml" ]; then
    print_error "Please run this script from the apps/scraping directory"
    exit 1
fi

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    print_error "Serverless Framework is not installed. Please install it with: npm install -g serverless"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured. Please run 'aws configure' first"
    exit 1
fi

# Get deployment stage (default to prod)
STAGE=${1:-prod}
print_status "Deploying to stage: $STAGE"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Please create one from .env.example"
    print_status "Copying .env.example to .env..."
    cp .env.example .env
    print_warning "Please edit .env with your configuration before deploying"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build TypeScript
print_status "Building TypeScript..."
npm run build

# Deploy to AWS
print_status "Deploying to AWS Lambda..."
npm run deploy:prod

print_status "Deployment completed successfully!"

# Show function URLs
print_status "Function URLs:"
serverless info --stage $STAGE

# Show logs command
print_status "To view logs, run:"
echo "npm run logs -- --function <function-name> --stage $STAGE"
