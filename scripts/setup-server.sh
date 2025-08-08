#!/bin/bash

# RRCompanion Server Setup Script
# This script sets up the server environment for RRCompanion deployment

set -e  # Exit on any error

echo "🚀 Starting RRCompanion server setup..."

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as ubuntu user."
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
if command -v node &> /dev/null; then
    print_status "Node.js installed: $(node --version)"
else
    print_error "Node.js installation failed"
    exit 1
fi

# Install Deno
print_status "Installing Deno..."
curl -fsSL https://deno.land/install.sh | sh

# Add Deno to PATH
echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify Deno installation
if command -v deno &> /dev/null; then
    print_status "Deno installed: $(deno --version | head -n1)"
else
    print_error "Deno installation failed"
    exit 1
fi

# Install Caddy
print_status "Installing Caddy..."
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# Start and enable Caddy
sudo systemctl start caddy
sudo systemctl enable caddy

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /var/www/rrcompanion
sudo chown ubuntu:ubuntu /var/www/rrcompanion

# Configure firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8000

print_status "Server setup completed!"
print_warning "Next steps:"
echo "1. Configure your RDS database connection in the .env file"
echo "2. Clone your repository to /var/www/rrcompanion"
echo "3. Configure environment variables"
echo "4. Build the frontend"
echo "5. Configure Caddy"
echo "6. Set up systemd service"
echo ""
echo "See AWS_DEPLOYMENT.md for detailed instructions." 