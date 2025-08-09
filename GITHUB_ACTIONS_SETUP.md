# GitHub Actions Setup Guide

This guide explains how to set up automated deployments for RRCompanion using
GitHub Actions.

## 🚀 **Workflows Overview**

### 1. **Main Deployment** (`.github/workflows/deploy.yml`)

- **Triggers**: Push to `main`/`master` branch, manual dispatch
- **What it does**: Deploys both backend and frontend to production server
- **Order**: Backend first, then frontend, then health checks

### 2. **Staging Deployment** (`.github/workflows/deploy-staging.yml`)

- **Triggers**: Push to `develop`/`staging` branches, pull requests
- **What it does**: Deploys to staging environment for testing
- **Includes**: Running tests before deployment

### 3. **Database Migration** (`.github/workflows/database-migrate.yml`)

- **Triggers**: Manual dispatch only
- **What it does**: Runs database migrations on the server
- **Use case**: When you need to update database schema

## 🔑 **Required GitHub Secrets**

You need to add these secrets in your GitHub repository:

### **Server Connection Secrets**

```
SERVER_HOST=35.83.131.166
SERVER_USERNAME=ubuntu
SERVER_SSH_KEY=your-private-ssh-key-content
SERVER_SSH_PORT=22
```

### **Application URLs**

```
BACKEND_URL=https://rrcompanion.com
FRONTEND_URL=https://rrcompanion.com
```

### **Stripe Configuration**

```
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### **Staging Environment (Optional)**

```
STAGING_HOST=your-staging-server-ip
STAGING_USERNAME=ubuntu
STAGING_SSH_KEY=your-staging-ssh-key
STAGING_SSH_PORT=22
```

## 📋 **How to Add Secrets**

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name shown above

## 🔧 **SSH Key Setup**

### **Generate SSH Key (if you don't have one)**

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@rrcompanion.com"
```

### **Add Public Key to Server**

```bash
# Copy the public key content
cat ~/.ssh/id_rsa.pub

# On your server, add to authorized_keys
echo "your-public-key-content" >> ~/.ssh/authorized_keys
```

### **Add Private Key to GitHub**

- Copy the **private key content** (including
  `-----BEGIN OPENSSH PRIVATE KEY-----`)
- Add it as `SERVER_SSH_KEY` secret

## 🚀 **How It Works**

### **Automatic Deployment**

1. Push code to `main` branch
2. GitHub Actions automatically triggers
3. Backend deploys first (pulls code, restarts service)
4. Frontend deploys second (builds and copies to web root)
5. Health checks verify both services are running

### **Manual Deployment**

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production**
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

## 📁 **Server Directory Structure**

The workflows expect this structure on your server:

```
/var/www/
├── rrcompanion/           # Backend code
│   ├── apps/
│   │   ├── api/          # Deno API
│   │   └── web/          # Frontend source
│   └── .git/             # Git repository
└── html/                  # Frontend build output (served by Caddy)
```

## 🔍 **Troubleshooting**

### **Backend Service Issues**

```bash
# Check service status
sudo systemctl status rrcompanion-api

# Check logs
sudo journalctl -u rrcompanion-api -f

# Restart manually
sudo systemctl restart rrcompanion-api
```

### **Frontend Issues**

```bash
# Check web root permissions
ls -la /var/www/html/

# Check Caddy status
sudo systemctl status caddy

# Reload Caddy
sudo systemctl reload caddy
```

### **Permission Issues**

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/html/

# Fix permissions
sudo chmod -R 755 /var/www/html/
```

## 🧪 **Testing the Setup**

1. **Make a small change** to your code
2. **Push to main branch**
3. **Check Actions tab** to see deployment progress
4. **Verify deployment** by checking your live site

## 🔄 **Customization Options**

### **Change Deployment Branch**

Edit `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches: [main, production] # Add your preferred branches
```

### **Add Environment Variables**

Add to the build step:

```yaml
- name: Build Frontend
  run: npm run build
  env:
    VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
    VITE_API_URL: ${{ secrets.API_URL }}
```

### **Modify Deployment Scripts**

Edit the `script:` sections in each workflow to match your server setup.

## 🎯 **Best Practices**

1. **Always test on staging** before deploying to production
2. **Use feature branches** for development
3. **Monitor deployment logs** for any errors
4. **Set up notifications** for deployment success/failure
5. **Keep secrets secure** and rotate them regularly

## 📞 **Support**

If you encounter issues:

1. Check the **Actions** tab for error logs
2. Verify your **secrets** are correctly set
3. Check **server permissions** and service status
4. Review the **deployment scripts** for your specific setup
