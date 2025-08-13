#!/bin/bash

# RRCompanion Simple Deployment Script
# This script does a simple stop-update-start deployment

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

print_status "Starting simple deployment for RRCompanion..."

# Pull latest changes
print_status "Pulling latest changes..."
cd /var/www/rrcompanion
git pull origin master

# Stop the API service
print_status "Stopping API service..."
sudo systemctl stop rrcompanion-api

# Build frontend
print_status "Building frontend..."
cd apps/web

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install
fi

npm run build

# Copy frontend to web directory
print_status "Deploying frontend..."
sudo cp -r dist/* /var/www/rrcompanion/apps/web/dist/
sudo chown -R ubuntu:ubuntu /var/www/rrcompanion/apps/web/dist/

# Update the service file to use the working template
print_status "Updating service configuration..."
cd /var/www/rrcompanion
sudo cp scripts/rrcompanion-api.service.template /etc/systemd/system/rrcompanion-api.service

# Edit the service file to set PORT=8000
sudo sed -i 's/Environment=PORT=\$NEW_PORT/Environment=PORT=8000/g' /etc/systemd/system/rrcompanion-api.service

# Reload systemd and start the service
print_status "Starting API service..."
sudo systemctl daemon-reload
sudo systemctl start rrcompanion-api

# Wait for service to be healthy
print_status "Waiting for API to be healthy..."
sleep 10

# Check if service is running
if sudo systemctl is-active --quiet rrcompanion-api; then
    print_status "API service started successfully"
    
    # Test health endpoint
    if curl -s -f "http://localhost:8000/health" > /dev/null 2>&1; then
        print_status "API health check passed"
    else
        print_warning "API is running but health check failed"
    fi
else
    print_error "API service failed to start"
    sudo systemctl status rrcompanion-api
    exit 1
fi

# Reload Nginx
print_status "Reloading Nginx..."
sudo systemctl reload nginx

print_status "Simple deployment completed successfully!"
print_info "API is running on port 8000"
print_info "Frontend is deployed to /var/www/rrcompanion/apps/web/dist"
print_warning "Please check the application at your domain"
