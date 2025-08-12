import { Context, Next } from 'oak';
import { getUserFromContext } from '../utils/auth.ts';

export async function adminMiddleware(ctx: Context, next: Next) {
  try {
    console.log('🔐 Admin middleware - Starting admin check...');
    const user = await getUserFromContext(ctx);
    console.log('🔐 Admin middleware - User loaded:', user ? { id: user.id, email: user.email, admin: user.admin } : 'null');

    if (!user) {
      console.log('❌ Admin middleware - No user found, returning 401');
      ctx.response.status = 401;
      ctx.response.body = { success: false, error: 'Unauthorized' };
      return;
    }

    console.log('🔐 Admin middleware - Checking admin status:', user.admin, 'Type:', typeof user.admin);
    if (!user.admin) {
      console.log('❌ Admin middleware - User is not admin, returning 403');
      ctx.response.status = 403;
      ctx.response.body = { success: false, error: 'Admin access required' };
      return;
    }

    console.log('✅ Admin middleware - Admin access granted for user:', user.email);
    await next();
  } catch (error) {
    console.error('❌ Admin middleware error:', error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: 'Internal server error' };
  }
}
