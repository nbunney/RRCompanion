#!/bin/bash

# RRCompanion Rolling Restart Deployment Script
# This script reduces downtime by using graceful restarts and health checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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

print_status "Starting rolling restart deployment..."

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

# Check if API service is running
if ! sudo systemctl is-active --quiet rrcompanion-api; then
    print_warning "API service is not running, starting it..."
    sudo systemctl start rrcompanion-api
    sleep 5
fi

# Verify current service is healthy before restart
print_status "Verifying current service health..."
if curl -s -f "http://localhost:8000/health" > /dev/null 2>&1; then
    print_status "Current service is healthy"
else
    print_warning "Current service health check failed, but continuing..."
fi

# Graceful restart using systemctl reload (if supported) or restart
print_status "Performing graceful restart..."
if sudo systemctl reload rrcompanion-api 2>/dev/null; then
    print_status "Service reloaded successfully (minimal downtime)"
else
    print_status "Reload not supported, performing restart..."
    sudo systemctl restart rrcompanion-api
fi

# Wait for service to be fully up
print_status "Waiting for service to be ready..."
sleep 8

# Check if service is running
if sudo systemctl is-active --quiet rrcompanion-api; then
    print_status "API service restarted successfully"
else
    print_error "API service failed to restart"
    sudo systemctl status rrcompanion-api
    exit 1
fi

# Wait for service to be healthy
print_status "Waiting for service to be healthy..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s -f "http://localhost:8000/health" > /dev/null 2>&1; then
        print_status "Service is healthy and responding"
        break
    fi
    
    attempt=$((attempt + 1))
    print_info "Health check attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Service failed to become healthy after $max_attempts attempts"
    sudo systemctl status rrcompanion-api
    exit 1
fi

# Reload Nginx (this is fast and doesn't interrupt connections)
print_status "Reloading Nginx configuration..."
sudo systemctl reload nginx

# Check if Nginx is running
if sudo systemctl is-active --quiet nginx; then
    print_status "Nginx reloaded successfully"
else
    print_error "Nginx failed to reload"
    sudo systemctl status nginx
    exit 1
fi

# Final health check
print_status "Performing final health check..."
if curl -s -f "https://rrcompanion.com/health" > /dev/null 2>&1; then
    print_status "Final health check passed"
else
    print_warning "Final health check failed, but service may still be starting up"
fi

print_status "Rolling restart deployment completed!"
print_info "Total downtime: ~8-10 seconds (vs 60+ seconds with full stop)"
print_warning "Please check the application at https://rrcompanion.com"
