import { Application, Router } from 'oak';
import { oakCors } from 'cors';
import { config } from 'dotenv';
import {
  closeDatabase,
  initializeDatabase,
  testConnection,
} from './config/database.ts';
import { CronService } from './services/cron.ts';
import authRoutes from './routes/auth.ts';
import oauthRoutes from './routes/oauth.ts';
import royalroadRoutes from './routes/royalroad.ts';
import fictionRoutes from './routes/fiction.ts';
import userFictionRoutes from './routes/userFiction.ts';
import fictionHistoryRoutes from './routes/fictionHistory.ts';
import { risingStarsRoutes } from './routes/risingStars.ts';
import risingStarsMainRoutes from './routes/risingStarsMain.ts';
import stripeRoutes from './routes/stripe.ts';
import adminRoutes from './routes/admin.ts';
import couponRoutes from './routes/coupon.ts';
import cacheRoutes from './routes/cache.ts';
import campaignRoutes from './routes/campaign.ts';
import retentionRoutes from './routes/retention.ts';
import { risingStarsPositionRoutes } from './routes/risingStarsPosition.ts';

// Load environment variables with multiple path attempts
console.log('🔍 Current working directory:', Deno.cwd());
console.log('🔍 Script location:', import.meta.url);

try {
  // Try relative to current working directory first
  config({ export: true });
  console.log('✅ Loaded .env from current working directory');
} catch (error) {
  console.log('❌ Failed to load from current working directory:', (error as Error).message);

  try {
    // Try relative to the script location (go up one directory to apps/api/)
    const scriptDir = new URL('.', import.meta.url).pathname;
    const apiDir = scriptDir.replace('/src/', '/');
    const envPath = apiDir + '.env';
    console.log('🔍 Trying script location path:', envPath);
    config({ path: envPath, export: true });
    console.log('✅ Loaded .env from script location:', envPath);
  } catch (error2) {
    console.log('❌ Failed to load from script location:', (error2 as Error).message);

    try {
      // Try relative to current working directory but go up to apps/api/
      const cwd = Deno.cwd();
      let envPath;
      if (cwd.includes('/src')) {
        envPath = cwd.replace('/src', '') + '/.env';
      } else if (cwd.includes('/apps/api')) {
        envPath = cwd + '/.env';
      } else {
        envPath = cwd + '/apps/api/.env';
      }
      console.log('🔍 Trying adjusted path:', envPath);
      config({ path: envPath, export: true });
      console.log('✅ Loaded .env from adjusted path:', envPath);
    } catch (error3) {
      console.log('❌ Failed to load from adjusted path:', (error3 as Error).message);

      try {
        // Try absolute path from project root
        const absolutePath = '/var/www/rrcompanion/apps/api/.env';
        console.log('🔍 Trying absolute path:', absolutePath);
        config({ path: absolutePath, export: true });
        console.log('✅ Loaded .env from absolute path');
      } catch (error4) {
        console.log('❌ Failed to load from absolute path:', (error4 as Error).message);
        console.warn('❌ Could not load .env file, using system environment variables');
      }
    }
  }
}

// Debug: Check if Stripe key is loaded
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
if (stripeKey) {
  console.log('✅ Stripe key loaded:', stripeKey.substring(0, 20) + '...');
} else {
  console.log('❌ Stripe key not found in environment variables');
}

const app = new Application();
const router = new Router();

// CORS middleware
const corsOrigin = Deno.env.get('CORS_ORIGIN') || 'http://localhost:3000';
const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

app.use(oakCors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return true;
    // Allow localhost on any port for development
    if (origin.includes('localhost')) return true;
    return allowedOrigins.includes(origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(
    `${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status} - ${ms}ms`,
  );
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error('Unhandled error:', err);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    };
    // Don't call next() after setting response - this was causing the crash
  }
});

// Health check route
router.get('/api/health', (ctx) => {
  ctx.response.body = {
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  };
});

// Root health check for deployment script
router.get('/health', (ctx) => {
  ctx.response.body = {
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  };
});

// API routes - mount under /api prefix
router.use('/api/auth', authRoutes.routes(), authRoutes.allowedMethods());
router.use('/api/oauth', oauthRoutes.routes(), oauthRoutes.allowedMethods());
router.use(
  '/api/royalroad',
  royalroadRoutes.routes(),
  royalroadRoutes.allowedMethods(),
);
router.use('/api', fictionRoutes.routes(), fictionRoutes.allowedMethods());
router.use('/api', userFictionRoutes.routes(), userFictionRoutes.allowedMethods());
router.use('/api', fictionHistoryRoutes.routes(), fictionHistoryRoutes.allowedMethods());
router.use('/api', risingStarsRoutes.routes(), risingStarsRoutes.allowedMethods());
router.use('/api', risingStarsMainRoutes.routes(), risingStarsMainRoutes.allowedMethods());
router.use('/api/stripe', stripeRoutes.routes(), stripeRoutes.allowedMethods());
router.use('/api/admin', adminRoutes.routes(), adminRoutes.allowedMethods());
router.use('/api/cache', cacheRoutes.routes(), cacheRoutes.allowedMethods());
router.use('/api/coupons', couponRoutes.routes(), couponRoutes.allowedMethods());
router.use('/api/campaigns', campaignRoutes.routes(), campaignRoutes.allowedMethods());
router.use('/api/retention', retentionRoutes.routes(), retentionRoutes.allowedMethods());
router.use('/api/rising-stars-position', risingStarsPositionRoutes.routes(), risingStarsPositionRoutes.allowedMethods());

// Register router routes
app.use(router.routes());
app.use(router.allowedMethods());

// 404 handler - must be after router routes
app.use(async (ctx) => {
  ctx.response.status = 404;
  ctx.response.body = {
    success: false,
    error: 'Route not found',
  };
});

// Graceful shutdown
const handleShutdown = async () => {
  console.log('\n🛑 Shutting down server...');
  await closeDatabase();
  Deno.exit(0);
};

Deno.addSignalListener('SIGINT', handleShutdown);
Deno.addSignalListener('SIGTERM', handleShutdown);

// Start server
const port = parseInt(Deno.env.get('PORT') || '8000');
const host = Deno.env.get('HOST') || '0.0.0.0';

try {
  // Test database connection
  await testConnection();

  // Initialize database tables
  await initializeDatabase();

  // Start cron service for Rising Stars collection and Royal Road data collection in production
  const nodeEnv = Deno.env.get('NODE_ENV') || 'production'; // Default to production instead of development
  if (nodeEnv === 'production') {
    const cronService = new CronService();
    cronService.start();
    console.log(`🌙 Cron service started - Rising Stars collection at 1 minute past each quarter hour (1:01, 16:01, 31:01, 46:01)`);
    console.log(`🌐 Cron service started - Royal Road data collection every 6 hours`);
  } else {
    console.log(`🌙 Cron service skipped - NODE_ENV is '${nodeEnv}' (only runs in production)`);
  }

  console.log(`🚀 Server running on http://${host}:${port}`);
  console.log(`📊 Health check: http://${host}:${port}/health`);
  console.log(`🔐 API endpoints: http://${host}:${port}/api`);

  // Always bind to 0.0.0.0 for production deployment
  // This allows the server to accept connections from any IP address
  await app.listen({ port, hostname: '0.0.0.0' });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  Deno.exit(1);
}