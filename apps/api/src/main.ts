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
import stripeRoutes from './routes/stripe.ts';

// Load environment variables
config({ export: true });

const app = new Application();
const router = new Router();

// CORS middleware
const corsOrigin = Deno.env.get('CORS_ORIGIN') || 'https://localhost';
const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

app.use(oakCors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return true;
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
router.use('/api/stripe', stripeRoutes.routes(), stripeRoutes.allowedMethods());

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

  // Start cron service for nightly Rising Stars collection
  const cronService = new CronService();
  cronService.start();

  console.log(`🚀 Server running on http://${host}:${port}`);
  console.log(`📊 Health check: http://${host}:${port}/health`);
  console.log(`🔐 API endpoints: http://${host}:${port}/api`);
  console.log(`🌙 Cron service started - nightly Rising Stars collection at 12:23am PST`);

  // Always bind to 0.0.0.0 for production deployment
  // This allows the server to accept connections from any IP address
  await app.listen({ port, hostname: '0.0.0.0' });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  Deno.exit(1);
}
