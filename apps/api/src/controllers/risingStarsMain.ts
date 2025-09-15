import { Context } from 'oak';
import { RisingStarsMainService } from '../services/risingStarsMain.ts';
import type { ApiResponse } from '../types/index.ts';

export async function getRisingStarsMain(ctx: Context): Promise<void> {
  try {
    const risingStarsMainService = new RisingStarsMainService();
    const data = await risingStarsMainService.getRisingStarsMainList();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data
    } as ApiResponse;
  } catch (error) {
    console.error('Error getting Rising Stars Main list:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to get Rising Stars Main list'
    } as ApiResponse;
  }
}
