#!/bin/bash

# RRCompanion Deployment Script
# This script deploys updates to the RRCompanion application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as ubuntu user
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as ubuntu user."
   exit 1
fi

# Check if we're in the right directory
if [ ! -f "/var/www/rrcompanion/apps/api/src/main.ts" ]; then
    print_error "Please run this script from the /var/www/rrcompanion directory"
    exit 1
fi

print_status "Starting deployment..."

# Stop the API service
print_status "Stopping API service..."
sudo systemctl stop rrcompanion-api

# Pull latest changes
print_status "Pulling latest changes..."
cd /var/www/rrcompanion
git pull origin main

# Install frontend dependencies and build
print_status "Building frontend..."
cd apps/web
npm install
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Frontend build failed"
    exit 1
fi

print_status "Frontend built successfully"

# Start the API service
print_status "Starting API service..."
sudo systemctl start rrcompanion-api

# Wait a moment for the service to start
sleep 5

# Check if the service is running
if sudo systemctl is-active --quiet rrcompanion-api; then
    print_status "API service started successfully"
else
    print_error "API service failed to start"
    sudo systemctl status rrcompanion-api
    exit 1
fi

# Reload Caddy
print_status "Reloading Caddy..."
sudo systemctl reload caddy

# Check if Caddy is running
if sudo systemctl is-active --quiet caddy; then
    print_status "Caddy reloaded successfully"
else
    print_error "Caddy failed to reload"
    sudo systemctl status caddy
    exit 1
fi

print_status "Deployment completed successfully!"
print_warning "Please check the application at https://your-domain.com" 