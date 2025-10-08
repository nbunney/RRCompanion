# Caddy CSP Configuration Update

## Problem

Google Tag Manager and Google Fonts are being blocked by the Content Security
Policy (CSP).

## Solution

Update the Caddyfile on your server to include the proper CSP directives.

## Steps to Fix

### Option 1: Update Nginx Configuration on Server

SSH into your server and edit the Nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/rrcompanion
```

Find or add the CSP header in the `server` block (inside the HTTPS/443 section):

```nginx
# Add this line in your server block with other add_header directives
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com; connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://stats.g.doubleclick.net; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; frame-src https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self'; manifest-src 'self';" always;
```

Test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: Use the Template File

We've created a complete Nginx configuration template at the project root:

```bash
# From your local machine, copy to server
scp nginx-rrcompanion.conf.template user@your-server:/tmp/

# On the server (backup existing first!)
sudo cp /etc/nginx/sites-available/rrcompanion /etc/nginx/sites-available/rrcompanion.backup
sudo cp /tmp/nginx-rrcompanion.conf.template /etc/nginx/sites-available/rrcompanion

# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

## What This CSP Allows

### ✅ Scripts

- Your own scripts (`'self'`)
- Inline scripts (`'unsafe-inline'`)
- Eval for compatibility (`'unsafe-eval'`)
- Stripe payment processing
- Google Tag Manager
- Google Analytics

### ✅ Stylesheets

- Your own styles (`'self'`)
- Inline styles (`'unsafe-inline'`)
- **Google Fonts** (`https://fonts.googleapis.com`)

### ✅ Connections

- Your API (`'self'`)
- Stripe API
- Google Analytics
- Google Tag Manager

### ✅ Images

- All HTTPS images
- Data URIs
- Blob URIs

### ✅ Fonts

- Your own fonts (`'self'`)
- **Google Fonts** (`https://fonts.gstatic.com`)

## Testing

After updating, test by:

1. Opening your site in browser DevTools
2. Checking Console for CSP errors
3. Verifying Google Tag Manager loads
4. Verifying Google Fonts load
5. Confirming Stripe still works

## Note About Meta Tag CSP

The CSP meta tag in `index.html` is a backup, but **server-side CSP headers take
precedence**. This is why we need to update the Caddyfile.

## Security

This CSP maintains security while allowing necessary third-party services:

- ✅ Blocks unauthorized scripts
- ✅ Prevents XSS attacks (with unsafe-inline as needed)
- ✅ Restricts frame embedding
- ✅ Validates all external resources
- ✅ Allows only trusted domains

## Quick Commands

### Check Current CSP

```bash
curl -I https://rrcompanion.com | grep -i content-security
```

### Check Current Nginx Config

```bash
sudo nginx -T | grep -i content-security
```

### View Nginx Site Config

```bash
sudo cat /etc/nginx/sites-available/rrcompanion
```

### Test Nginx Configuration

```bash
sudo nginx -t
```

### Reload Nginx (after changes)

```bash
sudo systemctl reload nginx
```
