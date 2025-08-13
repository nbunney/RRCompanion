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
# Check which dist directory is newer and create a symlink
if [ -d "apps/web/dist-blue" ] && [ -d "apps/web/dist-green" ]; then
    # Compare modification times and use the newer one
    if [ "apps/web/dist-blue" -nt "apps/web/dist-green" ]; then
        echo "📁 Using dist-blue (newer)"
        cd apps/web
        rm -f dist
        ln -sf dist-blue dist
        cd ../..
    else
        echo "📁 Using dist-green (newer)"
        cd apps/web
        rm -f dist
        ln -sf dist-green dist
        cd ../..
    fi
elif [ -d "apps/web/dist-blue" ]; then
    echo "📁 Using dist-blue"
    cd apps/web
    rm -f dist
    ln -sf dist-blue dist
    cd ../..
elif [ -d "apps/web/dist-green" ]; then
    echo "📁 Using dist-green"
    cd apps/web
    rm -f dist
    ln -sf dist-green dist
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
