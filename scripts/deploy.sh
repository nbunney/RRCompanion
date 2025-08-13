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
echo "📁 Current working directory: $(pwd)"
echo "📄 Service template contents:"
cat scripts/rrcompanion-api.service.template
echo ""

sudo cp scripts/rrcompanion-api.service.template /etc/systemd/system/rrcompanion-api.service
echo "✅ Service file copied to /etc/systemd/system/rrcompanion-api.service"

echo "📄 Installed service file contents:"
cat /etc/systemd/system/rrcompanion-api.service
echo ""

sudo systemctl daemon-reload
echo "🔄 Systemd daemon reloaded"

echo "🌐 Setting up frontend files..."
# Simply use dist directory - no more blue-green complexity
if [ -d "apps/web/dist-blue" ]; then
    echo "📁 Copying dist-blue to dist"
    cd apps/web
    rm -rf dist
    cp -r dist-blue dist
    cd ../..
elif [ -d "apps/web/dist-green" ]; then
    echo "📁 Copying dist-green to dist"
    cd apps/web
    rm -rf dist
    cp -r dist-green dist
    cd ../..
else
    echo "⚠️  No frontend dist directories found"
fi

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
