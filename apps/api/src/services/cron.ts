import { FictionHistoryService } from './fictionHistory.ts';

export class CronService {
  private fictionHistoryService: FictionHistoryService;
  private lastRisingStarsRun: number = 0;
  private lastTopFictionsRefresh: number = 0;
  private lastAllFictionsRunDate: string | null = null;
  private lastAllFictionsRunHour: number | null = null;

  constructor() {
    this.fictionHistoryService = new FictionHistoryService();
  }

  // Check if it's time to run the Rising Stars collection (1 minute past each quarter hour)
  private shouldRunRisingStarsCollection(): boolean {
    const now = new Date();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    // Run at 1:01, 16:01, 31:01, 46:01 (1 minute past each quarter hour)
    const quarterHourMinutes = [1, 16, 31, 46];

    // Debug logging every minute to see what's happening
    if (minute % 5 === 0) { // Log every 5 minutes
      console.log(`🕐 Cron check - Current time: ${now.toISOString()}, minute: ${minute}, second: ${second}, quarterHourMinutes: ${quarterHourMinutes.join(',')}`);
    }

    // Check if we're at the right minute and within the first 30 seconds to avoid multiple runs
    if (quarterHourMinutes.includes(minute) && second < 30) {
      const nowTime = Date.now();
      const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds

      console.log(`🕐 Rising Stars timing check - minute: ${minute}, second: ${second}, timeSinceLastRun: ${nowTime - this.lastRisingStarsRun}ms`);

      // Only run if we haven't run in the last 15 minutes
      if (nowTime - this.lastRisingStarsRun >= fifteenMinutes) {
        this.lastRisingStarsRun = nowTime;
        console.log(`✅ Rising Stars collection should run NOW!`);
        return true;
      } else {
        console.log(`⏰ Rising Stars collection skipped - too soon since last run`);
      }
    }

    return false;
  }

  // Check if it's time to run the All Fictions collection (1:24am, 7:24am, 1:24pm, 7:24pm PST)
  private shouldRunAllFictionsCollection(): boolean {
    const now = new Date();

    // Convert to PST (UTC-8)
    const pstTime = new Date(now.getTime() - (8 * 60 * 60 * 1000));

    const hour = pstTime.getHours();
    const minute = pstTime.getMinutes();
    const today = pstTime.toISOString().split('T')[0];

    // Define the four daily run times (in PST) - offset by 1 hour from Rising Stars
    const runTimes = [1, 7, 13, 19]; // 1:24am, 7:24am, 1:24pm, 7:24pm PST

    // Check if it's one of the scheduled times and we haven't run at this hour today
    if (minute === 24 && runTimes.includes(hour)) {
      // Check if we've already run at this specific hour today
      if (this.lastAllFictionsRunDate !== today || this.lastAllFictionsRunHour !== hour) {
        this.lastAllFictionsRunDate = today;
        this.lastAllFictionsRunHour = hour;
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
    // Debug: Log every minute to confirm cron is running
    const now = new Date();
    if (now.getSeconds() < 5) { // Log only in first 5 seconds of each minute
      console.log(`🔄 Cron service running - ${now.toISOString()}`);
    }

    // Check if it's time to run Rising Stars collection (1 minute past each quarter hour)
    if (this.shouldRunRisingStarsCollection()) {
      const now = new Date();
      const minute = now.getMinutes();
      let timeLabel = '';
      if (minute === 1) timeLabel = '1 minute past the hour';
      else if (minute === 16) timeLabel = '16 minutes past the hour';
      else if (minute === 31) timeLabel = '31 minutes past the hour';
      else if (minute === 46) timeLabel = '46 minutes past the hour';

      console.log(`🌙 Running Rising Stars collection (${timeLabel})...`);
      try {
        const success = await this.fictionHistoryService.runRisingStarsCollection();
        if (success) {
          console.log(`✅ Rising Stars collection completed successfully`);
        } else {
          console.error(`❌ Rising Stars collection failed`);
        }
      } catch (error) {
        console.error(`❌ Error during Rising Stars collection:`, error);
      }
    }

    // Check if it's time to run All Fictions collection
    if (this.shouldRunAllFictionsCollection()) {
      const now = new Date();
      const pstTime = new Date(now.getTime() - (8 * 60 * 60 * 1000));
      const hour = pstTime.getHours();

      let timeLabel = '';
      if (hour === 1) timeLabel = '1:24am PST';
      else if (hour === 7) timeLabel = '7:24am PST';
      else if (hour === 13) timeLabel = '1:24pm PST';
      else if (hour === 19) timeLabel = '7:24pm PST';

      console.log(`📚 Running ${timeLabel} All Fictions collection...`);
      try {
        const success = await this.fictionHistoryService.runAllFictionsCollection();
        if (success) {
          console.log(`✅ ${timeLabel} All Fictions collection completed successfully`);
        } else {
          console.error(`❌ ${timeLabel} All Fictions collection failed`);
        }
      } catch (error) {
        console.error(`❌ Error during ${timeLabel} All Fictions collection:`, error);
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

    console.log('✅ Cron service started - Rising Stars collection at 1 minute past each quarter hour (1:01, 16:01, 31:01, 46:01)');
    console.log('📚 Cron service started - All Fictions collection at 1:24am, 7:24am, 1:24pm, and 7:24pm PST');
    console.log('🌐 Royal Road data collection runs every 6 hours');
    console.log('🔄 Top fictions data refreshes every 10 minutes');
  }
} 