#!/bin/bash

# RRCompanion Zero-Downtime Deployment Script
# This script implements blue-green deployment to eliminate service interruption

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

print_status "Starting zero-downtime deployment..."

# Determine current active instance
if sudo systemctl is-active --quiet rrcompanion-api; then
    CURRENT_INSTANCE="blue"
    NEW_INSTANCE="green"
    CURRENT_SERVICE="rrcompanion-api"
    NEW_SERVICE="rrcompanion-api-green"
    CURRENT_PORT="8000"
    NEW_PORT="8001"
else
    CURRENT_INSTANCE="green"
    NEW_INSTANCE="blue"
    CURRENT_SERVICE="rrcompanion-api-green"
    NEW_SERVICE="rrcompanion-api"
    CURRENT_PORT="8001"
    NEW_PORT="8000"
fi

print_info "Current active instance: $CURRENT_INSTANCE (port $CURRENT_PORT)"
print_info "New instance will be: $NEW_INSTANCE (port $NEW_PORT)"

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

# Create new service file for the new instance
print_status "Setting up new API instance on port $NEW_PORT..."

# Create new service file
sudo tee /etc/systemd/system/$NEW_SERVICE.service > /dev/null <<EOF
[Unit]
Description=RRCompanion API ($NEW_INSTANCE)
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/rrcompanion/apps/api
Environment=PATH=/home/ubuntu/.deno/bin:/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
Environment=PORT=$NEW_PORT
ExecStart=/home/ubuntu/.deno/bin/deno run --allow-net --allow-env --allow-read --allow-write src/main.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$NEW_SERVICE

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/rrcompanion

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start new service
sudo systemctl daemon-reload
sudo systemctl start $NEW_SERVICE

# Wait for new service to be healthy
print_status "Waiting for new instance to be healthy..."
sleep 10

# Check if new service is running and responding
if sudo systemctl is-active --quiet $NEW_SERVICE; then
    print_status "New API instance started successfully"
    
    # Test if the new instance is responding
    if curl -s -f "http://localhost:$NEW_PORT/api/health" > /dev/null 2>&1; then
        print_status "New instance is responding to health checks"
    else
        print_warning "New instance is running but health check failed - will continue anyway"
    fi
else
    print_error "New API instance failed to start"
    sudo systemctl status $NEW_SERVICE
    exit 1
fi

# Update Nginx configuration to point to new instance
print_status "Updating Nginx to point to new instance..."

# Create a new Nginx site configuration
sudo tee /etc/nginx/sites-available/rrcompanion-new > /dev/null <<EOF
server {
    listen 80;
    server_name rrcompanion.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name rrcompanion.com;
    
    # SSL configuration (adjust paths as needed)
    ssl_certificate /etc/letsencrypt/live/rrcompanion.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rrcompanion.com/privkey.pem;
    
    # Frontend static files
    root /var/www/rrcompanion/apps/web/dist;
    index index.html;
    
    # Handle frontend routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # API reverse proxy to new instance
    location /api/ {
        proxy_pass http://localhost:$NEW_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # OAuth callback handling
    location /api/oauth/ {
        proxy_pass http://localhost:$NEW_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$NEW_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the new site and disable the old one
sudo ln -sf /etc/nginx/sites-available/rrcompanion-new /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/rrcompanion

# Test Nginx configuration
print_status "Testing Nginx configuration..."
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

# Reload Nginx (this is fast and doesn't interrupt connections)
print_status "Reloading Nginx configuration..."
sudo systemctl reload nginx

# Wait a moment for Nginx to fully switch over
sleep 3

# Verify Nginx is pointing to new instance
if curl -s -f "https://rrcompanion.com/health" > /dev/null 2>&1; then
    print_status "Nginx successfully switched to new instance"
else
    print_error "Nginx failed to switch to new instance"
    exit 1
fi

# Stop the old instance
print_status "Stopping old instance..."
sudo systemctl stop $CURRENT_SERVICE

# Wait a moment to ensure all connections are closed
sleep 5

# Verify old instance is stopped
if sudo systemctl is-active --quiet $CURRENT_SERVICE; then
    print_warning "Old instance is still running - forcing stop"
    sudo systemctl kill $CURRENT_SERVICE
else
    print_status "Old instance stopped successfully"
fi

# Clean up old service file
print_status "Cleaning up old service file..."
sudo systemctl disable $CURRENT_SERVICE
sudo rm -f /etc/systemd/system/$CURRENT_SERVICE.service
sudo systemctl daemon-reload

print_status "Zero-downtime deployment completed successfully!"
print_info "New instance is now active on port $NEW_PORT"
print_warning "Please check the application at https://rrcompanion.com" 