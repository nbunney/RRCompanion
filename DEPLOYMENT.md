# Deployment Guide

This guide covers deploying both the Deno API and React web application.

## API Deployment (Deno)

### Option 1: Deno Deploy (Recommended)

1. **Install Deno CLI** (if not already installed):
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Deploy to Deno Deploy**:
   ```bash
   # Install Deno Deploy CLI
   deno install --allow-all --no-check -r -f https://deno.land/x/deploy/deployctl.ts

   # Deploy
   deployctl deploy --project=your-project-name apps/api/src/main.ts
   ```

3. **Environment Variables**:
   - Set up environment variables in Deno Deploy dashboard
   - Configure database connection string
   - Set JWT secret

### Option 2: Railway

1. **Connect your repository** to Railway
2. **Set build command**:
   `deno run --allow-net --allow-env --allow-read --allow-write apps/api/src/main.ts`
3. **Configure environment variables**
4. **Deploy**

### Option 3: Render

1. **Create a new Web Service**
2. **Set build command**:
   `deno run --allow-net --allow-env --allow-read --allow-write apps/api/src/main.ts`
3. **Configure environment variables**
4. **Deploy**

## Web Deployment (React)

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd apps/web
   vercel
   ```

3. **Configure environment variables**:
   - Set API URL in Vercel dashboard

### Option 2: Netlify

1. **Build the project**:
   ```bash
   cd apps/web
   npm run build
   ```

2. **Deploy to Netlify**:
   - Drag and drop the `dist` folder to Netlify
   - Or connect your repository for automatic deployments

### Option 3: GitHub Pages

1. **Add GitHub Pages configuration** to your repository
2. **Set up GitHub Actions** for automatic deployment
3. **Configure base URL** in Vite config

## Database Setup

### MariaDB Setup

1. **Local Development**:
   ```bash
   # Install MariaDB
   brew install mariadb  # macOS
   sudo apt-get install mariadb-server  # Ubuntu

   # Start MariaDB
   brew services start mariadb  # macOS
   sudo systemctl start mariadb  # Ubuntu

   # Create database
   mysql -u root -p -e "CREATE DATABASE rrcompanion;"
   ```

2. **Production Database**:
   - Use managed MariaDB services (PlanetScale, Railway, etc.)
   - Set up connection pooling
   - Configure backups

### Environment Variables

Create `.env` file in `apps/api/`:

```env
# Database
DATABASE_URL=mysql://username:password@localhost:3306/rrcompanion
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rrcompanion
DB_USER=root
DB_PASSWORD=password

# Server
PORT=8000
HOST=0.0.0.0
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

## SSL/HTTPS

### For Production

1. **Use managed SSL** (Vercel, Netlify, Railway provide this)
2. **Or configure custom domain** with SSL certificate
3. **Update CORS settings** to use HTTPS

## Monitoring

### API Monitoring

1. **Health Check Endpoint**: `GET /health`
2. **Logging**: Configure structured logging
3. **Error Tracking**: Set up error monitoring (Sentry, etc.)

### Web Monitoring

1. **Analytics**: Google Analytics, Plausible, etc.
2. **Error Tracking**: Sentry, LogRocket, etc.
3. **Performance**: Lighthouse, Web Vitals

## Security Checklist

- [ ] Use strong JWT secrets
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Validate all inputs
- [ ] Use parameterized queries
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Regular dependency updates
- [ ] Database backups
- [ ] Environment variable security

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS_ORIGIN configuration
2. **Database Connection**: Verify DATABASE_URL format
3. **JWT Issues**: Ensure JWT_SECRET is set
4. **Build Failures**: Check TypeScript errors
5. **Deployment Failures**: Verify environment variables

### Debug Commands

```bash
# Test API locally
cd apps/api
deno run --allow-net --allow-env --allow-read --allow-write src/main.ts

# Test web app locally
cd apps/web
npm run dev

# Check database connection
mysql -u root -p -e "SELECT VERSION();"

# Test API endpoints
curl http://localhost:8000/health
```
