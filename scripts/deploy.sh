#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting RRCompanion deployment..."

# Navigate to project root
cd /var/www/rrcompanion

echo "📥 Pulling latest code..."
git pull origin master

echo "✅ Frontend files already copied by GitHub Actions"
echo "📁 Checking dist directory..."
ls -la apps/web/dist/assets/

echo "⚙️  Updating API service configuration..."
# Copy service file
sudo cp scripts/rrcompanion-api.service.template /etc/systemd/system/rrcompanion-api.service

# Reload systemd
sudo systemctl daemon-reload
echo "🔄 Systemd daemon reloaded"

echo "⏹️  Stopping API service..."
sudo systemctl stop rrcompanion-api || true

echo "▶️  Starting API service..."
sudo systemctl start rrcompanion-api

echo "⏳ Waiting for API to be ready..."
sleep 5

# Check if service started successfully
if sudo systemctl is-active --quiet rrcompanion-api; then
    echo "✅ API service started successfully!"
    echo "📊 Service Status:"
    sudo systemctl status rrcompanion-api --no-pager
else
    echo "❌ API service failed to start"
    echo "📋 Service Status:"
    sudo systemctl status rrcompanion-api --no-pager
    exit 1
fi

echo "🎉 Deployment completed successfully!"
