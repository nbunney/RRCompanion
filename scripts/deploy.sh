#!/bin/bash

# Simple RRCompanion Deployment
# This script just works - no complexity

set -e

echo "🚀 Starting simple deployment..."

# Go to project directory
cd /var/www/rrcompanion

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin master

# Stop the API service
echo "⏹️  Stopping API service..."
sudo systemctl stop rrcompanion-api

# Copy the working service template
echo "⚙️  Updating service configuration..."
sudo cp scripts/rrcompanion-api.service.template /etc/systemd/system/rrcompanion-api.service

# Start the API service
echo "▶️  Starting API service..."
sudo systemctl daemon-reload
sudo systemctl start rrcompanion-api

# Wait for service to be ready
echo "⏳ Waiting for API to be ready..."
sleep 5

# Check if service is running
if sudo systemctl is-active --quiet rrcompanion-api; then
    echo "✅ API service is running"
else
    echo "❌ API service failed to start"
    sudo systemctl status rrcompanion-api
    exit 1
fi

# Test the API
echo "🧪 Testing API..."
if curl -s -f "http://localhost:8000/health" > /dev/null; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    exit 1
fi

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "🎉 Deployment completed successfully!"
echo "🌐 Your site should now be working at https://rrcompanion.com"
