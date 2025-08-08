# AWS EC2 Deployment Guide with Caddy

This guide will help you deploy the RRCompanion application to your AWS EC2
server using Caddy as the reverse proxy.

## Prerequisites

- AWS EC2 instance running Ubuntu 22.04 LTS or later
- Domain name pointing to your EC2 instance
- SSH access to your EC2 instance
- Basic knowledge of Linux commands
- **RDS instance already configured and accessible**

## Step 1: Server Setup

### 1.1 Update System Packages

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### 1.2 Install Node.js and npm

```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.3 Install Deno

```bash
# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Add Deno to PATH
echo 'export DENO_INSTALL="$HOME/.deno"' >> ~/.bashrc
echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
deno --version
```

### 1.4 Install Caddy

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Start and enable Caddy
sudo systemctl start caddy
sudo systemctl enable caddy
```

## Step 2: Application Setup

### 2.1 Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/rrcompanion
sudo chown ubuntu:ubuntu /var/www/rrcompanion
cd /var/www/rrcompanion

# Clone your repository
git clone https://github.com/yourusername/RRCompanion.git .
```

### 2.2 Setup Environment Variables

```bash
# Create environment file for API
cd apps/api
cp env.example .env
nano .env
```

Update the `.env` file with your production values:

```env
# Database Configuration (RDS)
DATABASE_URL=mysql://username:password@your-rds-endpoint:3306/rrcompanion
DB_HOST=your-rds-endpoint
DB_PORT=3306
DB_NAME=rrcompanion
DB_USER=your-rds-username
DB_PASSWORD=your-rds-password

# Server Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Logging
LOG_LEVEL=info
```

### 2.3 Build Frontend

```bash
# Navigate to web directory
cd /var/www/rrcompanion/apps/web

# Install dependencies
npm install

# Build the application
npm run build
```

### 2.4 Test API

```bash
# Navigate to API directory
cd /var/www/rrcompanion/apps/api

# Test the API
deno run --allow-net --allow-env --allow-read --allow-write src/main.ts
```

## Step 3: Caddy Configuration

### 3.1 Create Caddyfile

```bash
# Create Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Add the following configuration:

```caddyfile
# Replace your-domain.com with your actual domain
your-domain.com {
    # Serve the React frontend
    root * /var/www/rrcompanion/apps/web/dist
    try_files {path} /index.html
    file_server

    # Proxy API requests to the Deno backend
    handle /api/* {
        reverse_proxy localhost:8000
    }

    # Enable compression
    encode gzip

    # Security headers
    header {
        # Enable HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        # Prevent clickjacking
        X-Frame-Options "DENY"
        # Prevent MIME type sniffing
        X-Content-Type-Options "nosniff"
        # XSS protection
        X-XSS-Protection "1; mode=block"
        # Referrer policy
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Logging
    log {
        output file /var/log/caddy/rrcompanion.log
        format json
    }
}

# Redirect www to non-www (optional)
www.your-domain.com {
    redir https://your-domain.com{uri} permanent
}
```

### 3.2 Test Caddy Configuration

```bash
# Test Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

## Step 4: Systemd Services

### 4.1 Create API Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/rrcompanion-api.service
```

Add the following content:

```ini
[Unit]
Description=RRCompanion API
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/rrcompanion/apps/api
Environment=PATH=/home/ubuntu/.deno/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/ubuntu/.deno/bin/deno run --allow-net --allow-env --allow-read --allow-write src/main.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rrcompanion-api

[Install]
WantedBy=multi-user.target
```

### 4.2 Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable and start the API service
sudo systemctl enable rrcompanion-api
sudo systemctl start rrcompanion-api

# Check status
sudo systemctl status rrcompanion-api
```

## Step 5: Firewall Configuration

### 5.1 Configure UFW

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow API port (if needed for direct access)
sudo ufw allow 8000

# Check status
sudo ufw status
```

## Step 6: SSL Certificate

Caddy will automatically obtain and manage SSL certificates for your domain.
Make sure your domain is pointing to your EC2 instance's public IP address.

### 6.1 DNS Configuration

1. Go to your domain registrar's DNS settings
2. Add an A record pointing your domain to your EC2 instance's public IP
3. Add a CNAME record for www pointing to your domain

### 6.2 Verify SSL

```bash
# Check Caddy logs
sudo journalctl -u caddy -f

# Test SSL certificate
curl -I https://your-domain.com
```

## Step 7: Monitoring and Logs

### 7.1 View Logs

```bash
# API logs
sudo journalctl -u rrcompanion-api -f

# Caddy logs
sudo journalctl -u caddy -f

# Application logs
tail -f /var/log/caddy/rrcompanion.log
```

### 7.2 Health Check

```bash
# Test API health endpoint
curl https://your-domain.com/api/health

# Test frontend
curl -I https://your-domain.com
```

## Step 8: Deployment Script

Create a deployment script for easy updates:

```bash
# Create deployment script
nano /var/www/rrcompanion/deploy.sh
```

Add the following content:

```bash
#!/bin/bash

# Stop the API service
sudo systemctl stop rrcompanion-api

# Pull latest changes
cd /var/www/rrcompanion
git pull origin main

# Install frontend dependencies and build
cd apps/web
npm install
npm run build

# Start the API service
sudo systemctl start rrcompanion-api

# Reload Caddy
sudo systemctl reload caddy

echo "Deployment completed!"
```

Make it executable:

```bash
chmod +x /var/www/rrcompanion/deploy.sh
```

## Step 9: Backup Strategy

### 9.1 Database Backup

Since you're using RDS, backups are typically handled automatically by AWS.
However, you can create additional backup scripts if needed:

```bash
# Create backup script (if needed for additional backups)
nano /var/www/rrcompanion/backup.sh
```

Add the following content:

```bash
#!/bin/bash

# Create backup directory
mkdir -p /var/www/rrcompanion/backups

# Create database backup (if you have mysqldump access)
mysqldump -h your-rds-endpoint -u your-username -p'your-password' rrcompanion > /var/www/rrcompanion/backups/rrcompanion_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 7 days of backups
find /var/www/rrcompanion/backups -name "*.sql" -mtime +7 -delete
```

Make it executable and add to crontab:

```bash
chmod +x /var/www/rrcompanion/backup.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
# Add this line:
0 2 * * * /var/www/rrcompanion/backup.sh
```

## Troubleshooting

### Common Issues

1. **Caddy not starting**: Check Caddyfile syntax and permissions
2. **API not starting**: Check environment variables and database connection
3. **SSL issues**: Ensure domain is pointing to the correct IP
4. **Database connection**: Verify RDS endpoint and credentials are correct

### Useful Commands

```bash
# Check service status
sudo systemctl status rrcompanion-api
sudo systemctl status caddy

# View logs
sudo journalctl -u rrcompanion-api -f
sudo journalctl -u caddy -f

# Test database connection
mysql -h your-rds-endpoint -u your-username -p -e "SELECT VERSION();"

# Check ports
sudo netstat -tlnp | grep -E ':(80|443|8000)'
```

## Security Considerations

1. **Firewall**: Only allow necessary ports
2. **SSL**: Always use HTTPS in production
3. **Database**: Use RDS security groups and strong passwords
4. **Updates**: Regularly update system packages
5. **Backups**: RDS handles automatic backups
6. **Monitoring**: Set up log monitoring and alerts

## Next Steps

1. Set up monitoring and alerting (e.g., with Prometheus/Grafana)
2. Configure automated backups to S3 (if needed)
3. Set up CI/CD pipeline for automated deployments
4. Implement rate limiting and security headers
5. Set up error tracking (e.g., Sentry)

This setup provides a production-ready deployment of your RRCompanion
application on AWS EC2 with Caddy handling SSL and reverse proxy duties.
