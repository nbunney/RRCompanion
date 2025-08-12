import { Context, Next } from 'oak';
import { getUserFromContext } from '../utils/auth.ts';

export async function adminMiddleware(ctx: Context, next: Next) {
  try {
    const user = await getUserFromContext(ctx);

    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, error: 'Unauthorized' };
      return;
    }

    if (!user.admin) {
      ctx.response.status = 403;
      ctx.response.body = { success: false, error: 'Admin access required' };
      return;
    }

    await next();
  } catch (error) {
    console.error('❌ Admin middleware error:', error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: 'Internal server error' };
  }
}
