#!/bin/bash

# Simple RRCompanion Deployment
# This script just works - no complexity

set -e  # Exit on any error

echo "🚀 Starting simple deployment..."

# Navigate to project directory
cd /var/www/rrcompanion

echo "📥 Pulling latest code..."
git pull origin master

echo "⏹️  Stopping API service..."
sudo systemctl stop rrcompanion-api || true

echo "⚙️  Updating service configuration..."
sudo cp scripts/rrcompanion-api.service.template /etc/systemd/system/rrcompanion-api.service
sudo systemctl daemon-reload

echo "🔍 Checking Deno installation..."
which deno || echo "Deno not found in PATH"
ls -la /home/ubuntu/.deno/bin/ || echo "Deno directory not found"
deno --version || echo "Deno version check failed"

echo "▶️  Starting API service..."
sudo systemctl start rrcompanion-api

echo "⏳ Waiting for API to be ready..."
sleep 5

# Check service status
if sudo systemctl is-active --quiet rrcompanion-api; then
    echo "✅ API service started successfully!"
    echo "📊 Service Status:"
    sudo systemctl status rrcompanion-api --no-pager
else
    echo "❌ API service failed to start"
    echo "📋 Service Status:"
    sudo systemctl status rrcompanion-api --no-pager
    echo "📋 Recent logs:"
    sudo journalctl -u rrcompanion-api -n 20 --no-pager
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
