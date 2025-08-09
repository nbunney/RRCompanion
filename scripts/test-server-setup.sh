#!/bin/bash

# Test Server Setup for GitHub Actions
# This script verifies your server is ready for automated deployment

echo "🔍 Testing RRCompanion server setup for GitHub Actions..."
echo "========================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

print_status "Running as ubuntu user"

# Check if we're in the right directory
if [ ! -f "/var/www/rrcompanion/apps/api/src/main.ts" ]; then
    print_error "Please run this script from the /var/www/rrcompanion directory"
    exit 1
fi

print_status "Running from correct directory"

# Check Deno version
DENO_VERSION=$(deno --version | head -n1 | cut -d' ' -f2)
if [[ "$DENO_VERSION" == "2.4.3" ]]; then
    print_status "Deno version: $DENO_VERSION ✓"
else
    print_warning "Deno version: $DENO_VERSION (expected 2.4.3)"
fi

# Check if service exists
if sudo systemctl list-unit-files | grep -q "rrcompanion-api"; then
    print_status "rrcompanion-api service exists ✓"
else
    print_error "rrcompanion-api service not found"
fi

# Check service status
if sudo systemctl is-active --quiet rrcompanion-api; then
    print_status "rrcompanion-api service is running ✓"
else
    print_warning "rrcompanion-api service is not running"
fi

# Check if Caddy is installed
if sudo systemctl list-unit-files | grep -q "caddy"; then
    print_status "Caddy service exists ✓"
else
    print_error "Caddy service not found"
fi

# Check Caddy status
if sudo systemctl is-active --quiet caddy; then
    print_status "Caddy service is running ✓"
else
    print_warning "Caddy service is not running"
fi

# Check web root permissions
if [ -d "/var/www/html" ]; then
    print_status "Web root directory exists ✓"
    
    OWNER=$(stat -c '%U' /var/www/html)
    if [[ "$OWNER" == "www-data" ]]; then
        print_status "Web root owned by www-data ✓"
    else
        print_warning "Web root owned by $OWNER (expected www-data)"
    fi
else
    print_error "Web root directory /var/www/html not found"
fi

# Check SSH key setup
if [ -f ~/.ssh/id_rsa ]; then
    print_status "SSH private key exists ✓"
    
    if [ -f ~/.ssh/id_rsa.pub ]; then
        print_status "SSH public key exists ✓"
        echo "   Public key: $(cat ~/.ssh/id_rsa.pub | cut -d' ' -f2)"
    else
        print_error "SSH public key not found"
    fi
else
    print_error "SSH private key not found"
fi

# Check git remote
cd /var/www/rrcompanion
if git remote -v | grep -q "origin"; then
    print_status "Git remote origin configured ✓"
    echo "   Remote: $(git remote get-url origin)"
else
    print_error "Git remote origin not configured"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check if we can pull from origin
if git fetch origin > /dev/null 2>&1; then
    print_status "Can fetch from origin ✓"
else
    print_error "Cannot fetch from origin"
fi

echo ""
echo "📋 GitHub Actions Setup Checklist:"
echo "=================================="

echo "1. 🔑 SSH Key Setup:"
if [ -f ~/.ssh/id_rsa ] && [ -f ~/.ssh/id_rsa.pub ]; then
    echo "   ✅ SSH keys exist"
    echo "   📝 Add this public key to your GitHub repository:"
    echo "      $(cat ~/.ssh/id_rsa.pub)"
else
    echo "   ❌ SSH keys missing"
fi

echo ""
echo "2. 🔐 GitHub Secrets Required:"
echo "   SERVER_HOST=35.83.131.166"
echo "   SERVER_USERNAME=ubuntu"
echo "   SERVER_SSH_KEY=<content of ~/.ssh/id_rsa>"
echo "   SERVER_SSH_PORT=22"
echo "   BACKEND_URL=https://rrcompanion.com"
echo "   FRONTEND_URL=https://rrcompanion.com"
echo "   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here"

echo ""
echo "3. 🚀 Test Deployment:"
echo "   - Push code to main branch"
echo "   - Check Actions tab in GitHub"
echo "   - Verify deployment on server"

echo ""
if sudo systemctl is-active --quiet rrcompanion-api && sudo systemctl is-active --quiet caddy; then
    print_status "Server is ready for GitHub Actions deployment!"
else
    print_warning "Some services are not running. Please check service status."
fi 