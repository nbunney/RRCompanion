#!/bin/bash

# Test script for RRCompanion Serverless Scraping

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from example..."
    cp .env.example .env
    print_warning "Please edit .env with your configuration before testing"
    exit 1
fi

print_status "Starting serverless offline for testing..."

# Start serverless offline
serverless offline --httpPort 3001 --lambdaPort 3002
