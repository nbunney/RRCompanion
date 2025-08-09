#!/bin/bash

# Test GitHub Actions Workflows Locally
# This script simulates the GitHub Actions workflow steps locally

echo "🧪 Testing GitHub Actions workflows locally..."
echo "=============================================="
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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    print_error "Please run this script from the RRCompanion root directory"
    exit 1
fi

print_status "Running from correct directory"

# Test 1: Check Deno installation
echo ""
echo "🔧 Test 1: Deno Installation"
if command -v deno &> /dev/null; then
    DENO_VERSION=$(deno --version | head -n1 | cut -d' ' -f2)
    print_status "Deno found: $DENO_VERSION"
else
    print_error "Deno not found. Please install Deno first."
    exit 1
fi

# Test 2: Validate Backend
echo ""
echo "🔧 Test 2: Backend Validation"
cd apps/api
if deno check src/main.ts; then
    print_status "Backend validation passed"
else
    print_error "Backend validation failed"
    exit 1
fi
cd ../..

# Test 3: Check Node.js
echo ""
echo "🔧 Test 3: Node.js Installation"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js first."
    exit 1
fi

# Test 4: Check npm
echo ""
echo "🔧 Test 4: npm Installation"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm first."
    exit 1
fi

# Test 5: Frontend Dependencies
echo ""
echo "🔧 Test 5: Frontend Dependencies"
cd apps/web
if [ -f "package-lock.json" ]; then
    print_status "package-lock.json exists"
else
    print_warning "package-lock.json not found, will be created"
fi

# Test 6: Frontend Build
echo ""
echo "🔧 Test 6: Frontend Build"
echo "Installing dependencies..."
if npm ci; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo "Building frontend..."
if npm run build; then
    print_status "Frontend build successful"
    
    if [ -d "dist" ]; then
        print_status "dist directory created"
        echo "   Files in dist:"
        find dist -type f | head -10 | sed 's/^/     /'
        if [ $(find dist -type f | wc -l) -gt 10 ]; then
            echo "     ... and $(($(find dist -type f | wc -l) - 10)) more files"
        fi
    else
        print_error "dist directory not created"
        exit 1
    fi
else
    print_error "Frontend build failed"
    exit 1
fi

cd ../..

# Test 7: Check GitHub Actions files
echo ""
echo "🔧 Test 7: GitHub Actions Files"
if [ -d ".github/workflows" ]; then
    print_status ".github/workflows directory exists"
    
    WORKFLOW_FILES=$(find .github/workflows -name "*.yml" | wc -l)
    print_status "Found $WORKFLOW_FILES workflow files:"
    find .github/workflows -name "*.yml" | sed 's/^/     /'
else
    print_error ".github/workflows directory not found"
    exit 1
fi

# Test 8: Validate workflow syntax
echo ""
echo "🔧 Test 8: Workflow Syntax Validation"
cd .github/workflows
for workflow in *.yml; do
    echo "   Validating $workflow..."
    if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
        print_status "   $workflow syntax is valid"
    else
        print_error "   $workflow syntax is invalid"
        exit 1
    fi
done
cd ../..

# Test 9: Check required secrets
echo ""
echo "🔧 Test 9: Required Secrets Check"
echo "The following secrets need to be added to your GitHub repository:"
echo "   Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo "Required secrets:"
echo "   SERVER_HOST=35.83.131.166"
echo "   SERVER_USERNAME=ubuntu"
echo "   SERVER_SSH_KEY=<your-private-ssh-key>"
echo "   SERVER_SSH_PORT=22"
echo "   BACKEND_URL=https://rrcompanion.com"
echo "   FRONTEND_URL=https://rrcompanion.com"
echo "   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here"

# Test 10: Final summary
echo ""
echo "🎉 Local Testing Complete!"
echo "=========================="
print_status "All local tests passed"
echo ""
echo "Next steps:"
echo "1. Add the required secrets to your GitHub repository"
echo "2. Push this code to the main branch"
echo "3. Check the Actions tab in GitHub to see the deployment"
echo "4. Monitor the deployment logs for any issues"
echo ""
echo "💡 Tip: You can also manually trigger deployments from the Actions tab!"

# Clean up
if [ -d "apps/web/dist" ]; then
    echo ""
    echo "🧹 Cleaning up test build..."
    rm -rf apps/web/dist
    print_status "Cleanup complete"
fi 