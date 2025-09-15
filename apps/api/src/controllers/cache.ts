import { Context } from 'oak';
import { cacheService } from '../services/cache.ts';
import type { ApiResponse } from '../types/index.ts';

export async function getCacheStats(ctx: Context): Promise<void> {
  try {
    const stats = cacheService.getStats();
    
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    } as ApiResponse;
  } catch (error) {
    console.error('Error getting cache stats:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to get cache stats'
    } as ApiResponse;
  }
}

export async function clearCache(ctx: Context): Promise<void> {
  try {
    cacheService.clear();
    
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: 'Cache cleared successfully'
    } as ApiResponse;
  } catch (error) {
    console.error('Error clearing cache:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to clear cache'
    } as ApiResponse;
  }
}

export async function clearSpecificCache(ctx: Context): Promise<void> {
  try {
    const key = (ctx as any).params?.key;
    if (!key) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Cache key is required'
      } as ApiResponse;
      return;
    }

    const deleted = cacheService.delete(key);
    
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: deleted ? `Cache key '${key}' cleared successfully` : `Cache key '${key}' not found`
    } as ApiResponse;
  } catch (error) {
    console.error('Error clearing specific cache:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to clear specific cache'
    } as ApiResponse;
  }
}
