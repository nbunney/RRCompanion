import { Context } from 'oak';
import { FictionService } from '../services/fiction.ts';
import { UserFictionService } from '../services/userFiction.ts';
import type { ApiResponse } from '../types/index.ts';

/**
 * Add a fiction by Royal Road URL
 * This extracts the fiction ID from the URL and creates both the fiction
 * and user-fiction relationship
 */
export async function addFictionByUrl(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const body = await ctx.request.body.json();
    const { url } = body;

    if (!url) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'URL is required',
      } as ApiResponse;
      return;
    }

    // Extract fiction ID from URL
    const royalroadId = extractFictionIdFromUrl(url);
    if (!royalroadId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Invalid Royal Road URL. Please provide a valid fiction URL like: https://www.royalroad.com/fiction/12345/title',
      } as ApiResponse;
      return;
    }

    // Check if fiction exists in database
    const fiction = await FictionService.getFictionByRoyalRoadId(royalroadId);

    if (!fiction) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'Fiction not found in our database. Please try again later or contact support if the issue persists.',
        message: 'Fiction not yet scraped. Our system will automatically scrape it soon.',
      } as ApiResponse;
      return;
    }

    // Check if user already has this fiction
    const existingUserFiction = await UserFictionService.getUserFictionByUserAndFiction(user.id, fiction.id);

    if (existingUserFiction) {
      // Return the fiction but with a message that it already exists
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: fiction,
        message: 'Fiction already in your collection',
      } as ApiResponse;
      return;
    }

    // Create user-fiction relationship
    await UserFictionService.createUserFiction(user.id, {
      fiction_id: fiction.id,
      status: 'plan_to_read',
    });

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: fiction,
      message: 'Fiction added to your collection successfully',
    } as ApiResponse;
  } catch (error) {
    console.error('Add fiction by URL error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

/**
 * Extract Royal Road fiction ID from URL
 * Supports various URL formats:
 * - https://www.royalroad.com/fiction/12345/title
 * - https://www.royalroad.com/fiction/12345
 * - https://royalroad.com/fiction/12345/title
 * - www.royalroad.com/fiction/12345/title
 */
function extractFictionIdFromUrl(url: string): string | null {
  try {
    // Clean up the URL
    let cleanUrl = url.trim();

    // Add protocol if missing
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Parse URL
    const urlObj = new URL(cleanUrl);

    // Check if it's a Royal Road URL
    if (!urlObj.hostname.includes('royalroad.com')) {
      return null;
    }

    // Extract fiction ID from pathname
    // Expected format: /fiction/12345/title or /fiction/12345
    const match = urlObj.pathname.match(/\/fiction\/(\d+)/);

    if (match && match[1]) {
      return match[1];
    }

    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

