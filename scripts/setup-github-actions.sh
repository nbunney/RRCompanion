#!/bin/bash

# GitHub Actions Setup Script for RRCompanion
# This script helps you set up the required secrets and configuration

echo "🚀 Setting up GitHub Actions for RRCompanion"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f ".github/workflows/deploy.yml" ]; then
    echo "❌ Error: Please run this script from the RRCompanion root directory"
    exit 1
fi

echo "📋 This script will help you set up GitHub Actions deployment."
echo ""

# Generate SSH key if it doesn't exist
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "🔑 No SSH key found. Generating a new one..."
    ssh-keygen -t rsa -b 4096 -C "github-actions@rrcompanion.com" -f ~/.ssh/id_rsa -N ""
    echo "✅ SSH key generated!"
else
    echo "✅ SSH key already exists at ~/.ssh/id_rsa"
fi

echo ""
echo "📋 Next steps to complete setup:"
echo ""

echo "1. 🔑 Add your SSH public key to the server:"
echo "   cat ~/.ssh/id_rsa.pub"
echo "   # Copy the output and add it to ~/.ssh/authorized_keys on your server"
echo ""

echo "2. 🔐 Add these secrets to your GitHub repository:"
echo "   Go to: Settings → Secrets and variables → Actions"
echo "   Click 'New repository secret' and add:"
echo ""

echo "   SERVER_HOST=your-server-ip-or-domain"
echo "   SERVER_USERNAME=ubuntu"
echo "   SERVER_SSH_KEY=<content of ~/.ssh/id_rsa>"
echo "   SERVER_SSH_PORT=22"
echo "   BACKEND_URL=https://rrcompanion.com"
echo "   FRONTEND_URL=https://rrcompanion.com"
echo "   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here"
echo ""

echo "3. 🚀 Test the deployment:"
echo "   - Push this code to your main branch"
echo "   - Check the Actions tab in GitHub"
echo "   - Verify deployment on your server"
echo ""

echo "4. 📚 Read the full documentation:"
echo "   cat GITHUB_ACTIONS_SETUP.md"
echo ""

echo "🎉 Setup complete! Your GitHub Actions workflows are ready to use."
echo ""
echo "💡 Pro tip: You can also manually trigger deployments from the Actions tab!" 