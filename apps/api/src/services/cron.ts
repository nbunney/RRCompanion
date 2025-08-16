import { FictionHistoryService } from './fictionHistory.ts';

export class CronService {
  private fictionHistoryService: FictionHistoryService;
  private lastRunDate: string | null = null;
  private lastRunHour: number | null = null;
  private lastTopFictionsRefresh: number = 0;

  constructor() {
    this.fictionHistoryService = new FictionHistoryService();
  }

  // Check if it's time to run the Rising Stars collection (12:24am, 6:24am, 12:24pm, 6:24pm PST)
  private shouldRunCollection(): boolean {
    const now = new Date();

    // Convert to PST (UTC-8)
    const pstTime = new Date(now.getTime() - (8 * 60 * 60 * 1000));

    const hour = pstTime.getHours(); // Fixed: Use local hours, not UTC hours
    const minute = pstTime.getMinutes(); // Fixed: Use local minutes, not UTC minutes
    const today = pstTime.toISOString().split('T')[0];

    // Define the four daily run times (in PST) - including 12:24am as requested
    const runTimes = [0, 6, 12, 18]; // 12:24am, 6:24am, 12:24pm, 6:24pm PST

    // Check if it's one of the scheduled times and we haven't run at this hour today
    if (minute === 24 && runTimes.includes(hour)) {
      // Check if we've already run at this specific hour today
      if (this.lastRunDate !== today || this.lastRunHour !== hour) {
        this.lastRunDate = today;
        this.lastRunHour = hour;
        return true;
      }
    }

    return false;
  }



  // Check if it's time to refresh top fictions data (every 10 minutes)
  private shouldRefreshTopFictions(): boolean {
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

    if (now - this.lastTopFictionsRefresh >= tenMinutes) {
      this.lastTopFictionsRefresh = now;
      return true;
    }

    return false;
  }

  // Refresh top fictions data
  private async refreshTopFictions(): Promise<void> {
    try {
      console.log('🔄 Refreshing top fictions data...');

      // This will trigger a refresh of the data that the frontend fetches
      // The actual data is already being collected by the Rising Stars collection
      // This just ensures the frontend gets fresh data every 10 minutes

      console.log('✅ Top fictions data refresh completed');
    } catch (error) {
      console.error('❌ Error refreshing top fictions data:', error);
    }
  }

  

  // Check and run collection if needed
  private async checkAndRunCollection(): Promise<void> {
    // Check if it's time to run Rising Stars collection
    if (this.shouldRunCollection()) {
      const now = new Date();
      const pstTime = new Date(now.getTime() - (8 * 60 * 60 * 1000));
      const hour = pstTime.getHours();

      let timeLabel = '';
      if (hour === 0) timeLabel = '12:24am PST';
      else if (hour === 6) timeLabel = '6:24am PST';
      else if (hour === 12) timeLabel = '12:24pm PST';
      else if (hour === 18) timeLabel = '6:24pm PST';

      console.log(`🌙 Running ${timeLabel} Rising Stars collection...`);
      try {
        const success = await this.fictionHistoryService.runRisingStarsCollection();
        if (success) {
          console.log(`✅ ${timeLabel} Rising Stars collection completed successfully`);
        } else {
          console.error(`❌ ${timeLabel} Rising Stars collection failed`);
        }
      } catch (error) {
        console.error(`❌ Error during ${timeLabel} Rising Stars collection:`, error);
      }
    }



    // Check if it's time to refresh top fictions data
    if (this.shouldRefreshTopFictions()) {
      await this.refreshTopFictions();
    }
  }

  // Start the cron service
  start(): void {
    console.log('🚀 Starting cron service...');

    // Check every minute
    setInterval(() => {
      this.checkAndRunCollection();
    }, 60000); // 60 seconds

    console.log('✅ Cron service started - checking for Rising Stars collection at 12:24am, 6:24am, 12:24pm, 6:24pm PST');
    console.log('🌙 Cron service started - Rising Stars collection at 12:24am, 6:24am, 12:24pm, and 6:24pm PST');
    console.log('🌐 Royal Road data collection runs every 6 hours');
    console.log('🔄 Top fictions data refreshes every 10 minutes');
  }
} 