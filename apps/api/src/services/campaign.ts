// Campaign service for handling Royal Road advertising campaign data
// This service handles storing and retrieving campaign data from the database

import { client } from '../config/database.ts';

export interface CampaignData {
  id?: number;
  user_id?: number;
  username?: string;
  title: string;
  views: number;
  clicks: number;
  ctr: number;
  follow: number;
  read_later: number;
  raw_data?: any;
  scraped_at: string;
  url?: string;
}

export class CampaignService {
  /**
   * Store campaign data in the database
   */
  async storeCampaigns(campaigns: CampaignData[], userId?: number, username?: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();

      for (const campaign of campaigns) {
        await client.execute(
          `INSERT INTO advertising_campaigns (
            user_id, username, title, views, clicks, ctr, follow, read_later, 
            raw_data, scraped_at, url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId || null,
            username || null,
            campaign.title,
            campaign.views,
            campaign.clicks,
            campaign.ctr,
            campaign.follow,
            campaign.read_later,
            JSON.stringify(campaign.raw_data || {}),
            timestamp,
            campaign.url || null
          ]
        );
      }

      console.log(`Stored ${campaigns.length} campaigns for user ${username || 'unknown'}`);
    } catch (error) {
      console.error('Error storing campaigns:', error);
      throw new Error(`Failed to store campaigns: ${(error as Error).message}`);
    }
  }

  /**
   * Get campaigns for a specific user
   */
  async getCampaignsByUser(userId: number, limit: number = 100): Promise<CampaignData[]> {
    try {
      const campaigns = await client.query(
        `SELECT * FROM advertising_campaigns 
         WHERE user_id = ? 
         ORDER BY scraped_at DESC 
         LIMIT ?`,
        [userId, limit]
      );

      return campaigns.map((campaign: any) => ({
        id: campaign.id,
        user_id: campaign.user_id,
        username: campaign.username,
        title: campaign.title,
        views: campaign.views,
        clicks: campaign.clicks,
        ctr: campaign.ctr,
        follow: campaign.follow,
        read_later: campaign.read_later,
        raw_data: campaign.raw_data ? JSON.parse(campaign.raw_data) : {},
        scraped_at: campaign.scraped_at,
        url: campaign.url
      }));
    } catch (error) {
      console.error('Error getting campaigns by user:', error);
      throw new Error(`Failed to get campaigns: ${(error as Error).message}`);
    }
  }

  /**
   * Get all campaigns with pagination
   */
  async getAllCampaigns(page: number = 1, limit: number = 50): Promise<{
    campaigns: CampaignData[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await client.query('SELECT COUNT(*) as total FROM advertising_campaigns');
      const total = countResult[0]?.total || 0;

      // Get campaigns
      const campaigns = await client.query(
        `SELECT * FROM advertising_campaigns 
         ORDER BY scraped_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const formattedCampaigns = campaigns.map((campaign: any) => ({
        id: campaign.id,
        user_id: campaign.user_id,
        username: campaign.username,
        title: campaign.title,
        views: campaign.views,
        clicks: campaign.clicks,
        ctr: campaign.ctr,
        follow: campaign.follow,
        read_later: campaign.read_later,
        raw_data: campaign.raw_data ? JSON.parse(campaign.raw_data) : {},
        scraped_at: campaign.scraped_at,
        url: campaign.url
      }));

      return {
        campaigns: formattedCampaigns,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting all campaigns:', error);
      throw new Error(`Failed to get campaigns: ${(error as Error).message}`);
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(): Promise<{
    totalCampaigns: number;
    totalViews: number;
    totalClicks: number;
    averageCtr: number;
    totalFollows: number;
    totalReadLater: number;
  }> {
    try {
      const stats = await client.query(`
        SELECT 
          COUNT(*) as total_campaigns,
          SUM(views) as total_views,
          SUM(clicks) as total_clicks,
          AVG(ctr) as average_ctr,
          SUM(follow) as total_follows,
          SUM(read_later) as total_read_later
        FROM advertising_campaigns
      `);

      const result = stats[0];
      return {
        totalCampaigns: result.total_campaigns || 0,
        totalViews: result.total_views || 0,
        totalClicks: result.total_clicks || 0,
        averageCtr: parseFloat(result.average_ctr) || 0,
        totalFollows: result.total_follows || 0,
        totalReadLater: result.total_read_later || 0
      };
    } catch (error) {
      console.error('Error getting campaign stats:', error);
      throw new Error(`Failed to get campaign stats: ${(error as Error).message}`);
    }
  }

  /**
   * Delete old campaign data (older than specified days)
   */
  async deleteOldCampaigns(daysOld: number = 30): Promise<number> {
    try {
      const result = await client.execute(
        `DELETE FROM advertising_campaigns 
         WHERE scraped_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysOld]
      );

      console.log(`Deleted ${result.affectedRows || 0} old campaigns`);
      return result.affectedRows || 0;
    } catch (error) {
      console.error('Error deleting old campaigns:', error);
      throw new Error(`Failed to delete old campaigns: ${(error as Error).message}`);
    }
  }
}
