# Zero-Downtime Deployment Guide

## Current Problem

Your current deployment process stops the entire API service, causing users to
be knocked off for over a minute during updates.

## Important Notes

### 🌿 **Branch Naming**

- **Main branch**: `master` (not `main`)
- **All deployments**: Pull from `origin master`
- **GitHub Actions**: Configured to deploy from `master` branch

## Solution: Blue-Green Deployment

**File**: `scripts/deploy.sh`

**How it works**:

- Runs two API instances on different ports (8000 and 8001)
- Deploys new code to inactive instance
- Switches traffic to new instance once healthy
- **Eliminates downtime completely**

**Usage**:

```bash
cd /var/www/rrcompanion
./scripts/deploy.sh
```

**Benefits**:

- ✅ Zero downtime
- ✅ Easy rollback (switch back to old instance)
- ✅ No user interruption
- ✅ Professional-grade deployment strategy

## Quick Start: Blue-Green Deployment

1. **Update your server** with the new service file:
   ```bash
   sudo cp scripts/rrcompanion-api.service.template /etc/systemd/system/rrcompanion-api.service
   sudo systemctl daemon-reload
   sudo systemctl restart rrcompanion-api
   ```

2. **Deploy using the blue-green script**:
   ```bash
   cd /var/www/rrcompanion
   ./scripts/deploy.sh
   ```

## Expected Results

- **Before**: 60+ seconds of downtime
- **After**: Zero downtime

## How Blue-Green Deployment Works

1. **Current State**: One API instance running on port 8000, frontend served
   from `/var/www/rrcompanion/apps/web/dist`
2. **Deployment**:
   - New API instance starts on port 8001 with updated code
   - New frontend built to `/var/www/rrcompanion/apps/web/dist-green`
3. **Health Check**: New API instance is verified to be working
4. **Traffic Switch**: Nginx configuration updated to point to new API instance
   AND new frontend directory
5. **Cleanup**: Old API instance stopped, old frontend directory preserved for
   rollback

## What Gets Deployed

### 🔧 **API (Backend)**

- **Blue Instance**: Port 8000, service `rrcompanion-api`
- **Green Instance**: Port 8001, service `rrcompanion-api-green`
- **Switching**: Nginx proxy rules updated to point to new port

### 🎨 **Frontend (Vite)**

- **Blue Directory**: `/var/www/rrcompanion/apps/web/dist`
- **Green Directory**: `/var/www/rrcompanion/apps/web/dist-green`
- **Switching**: Nginx root directory updated to serve from new location

### 🔄 **Complete Blue-Green Strategy**

- **API**: Two separate Deno processes on different ports
- **Frontend**: Two separate build directories
- **Nginx**: Single configuration that switches both simultaneously
- **Result**: Zero downtime for both backend and frontend updates

## Health Check Endpoints

The deployment script uses these endpoints to verify service health:

- `http://localhost:8000/health` - Local health check (port 8000)
- `http://localhost:8001/health` - Local health check (port 8001)
- `https://rrcompanion.com/health` - Public health check

## Monitoring Deployment

Watch the deployment progress:

```bash
# Monitor service status
sudo systemctl status rrcompanion-api
sudo systemctl status rrcompanion-api-green

# Monitor logs
sudo journalctl -u rrcompanion-api -f
sudo journalctl -u rrcompanion-api-green -f

# Check health endpoints
curl http://localhost:8000/health
curl http://localhost:8001/health

# Monitor Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Nginx Configuration

The deployment script works with **Nginx**:

- **Configuration files**: `/etc/nginx/sites-available/` and
  `/etc/nginx/sites-enabled/`
- **Reload command**: `sudo systemctl reload nginx`
- **Configuration test**: `sudo nginx -t`
- **SSL certificates**: Assumes Let's Encrypt at
  `/etc/letsencrypt/live/rrcompanion.com/`

### Important Nginx Notes

1. **SSL Certificates**: Update the SSL certificate paths in the deployment
   scripts if yours are different
2. **Site Configuration**: The scripts create/update Nginx site configurations
   automatically
3. **Configuration Testing**: Nginx configuration is validated before reload to
   prevent errors

## Troubleshooting

### If deployment fails:

1. Check service status: `sudo systemctl status rrcompanion-api`
2. Check logs: `sudo journalctl -u rrcompanion-api -n 50`
3. Manual restart: `sudo systemctl restart rrcompanion-api`

### If health checks fail:

1. Verify the service is running
2. Check if ports 8000 and 8001 are accessible
3. Verify firewall settings

### If Nginx issues occur:

1. Check Nginx status: `sudo systemctl status nginx`
2. Test configuration: `sudo nginx -t`
3. Check error logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify site configurations: `ls -la /etc/nginx/sites-enabled/`

## Rollback Strategy

If something goes wrong during deployment:

1. **Quick Rollback**: The old instance is still running on the original port
2. **Manual Rollback**: Update Nginx to point back to the old instance
3. **Service Rollback**: Stop new instance, restart old instance

## Future Improvements

Once you're comfortable with the blue-green deployment, you can:

1. Add database migration safety checks
2. Implement automated rollback on health check failures
3. Add deployment notifications (Slack, email, etc.)
4. Customize Nginx configuration for your specific SSL setup
5. Add deployment metrics and monitoring

## Recommendation

**Use the blue-green deployment approach** (`deploy.sh`). It provides zero
downtime deployments with professional-grade reliability and easy rollback
capabilities.

## Nginx-Specific Commands

```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx (graceful, no downtime)
sudo systemctl reload nginx

# Restart Nginx (causes brief downtime)
sudo systemctl restart nginx

# View Nginx configuration
sudo nginx -T

# Check Nginx process
ps aux | grep nginx

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log
```
