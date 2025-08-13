import { FictionHistoryService } from './fictionHistory.ts';

export class CronService {
  private fictionHistoryService: FictionHistoryService;
  private lastRunDate: string | null = null;
  private lastRunHour: number | null = null;

  constructor() {
    this.fictionHistoryService = new FictionHistoryService();
  }

  // Check if it's time to run the collection (6:23am, 12:23pm, 6:23pm PST)
  private shouldRunCollection(): boolean {
    const now = new Date();

    // Convert to PST (UTC-8)
    const pstTime = new Date(now.getTime() - (8 * 60 * 60 * 1000));

    const hour = pstTime.getHours(); // Fixed: Use local hours, not UTC hours
    const minute = pstTime.getMinutes(); // Fixed: Use local minutes, not UTC minutes
    const today = pstTime.toISOString().split('T')[0];

    // Define the three daily run times (in PST) - removed 12:23am to avoid duplication
    const runTimes = [6, 12, 18]; // 6:23am, 12:23pm, 6:23pm PST

    // Check if it's one of the scheduled times and we haven't run at this hour today
    if (minute === 23 && runTimes.includes(hour)) {
      // Check if we've already run at this specific hour today
      if (this.lastRunDate !== today || this.lastRunHour !== hour) {
        this.lastRunDate = today;
        this.lastRunHour = hour;
        return true;
      }
    }

    return false;
  }

  // Check and run collection if needed
  private async checkAndRunCollection(): Promise<void> {
    if (this.shouldRunCollection()) {
      const now = new Date();
      const pstTime = new Date(now.getTime() - (8 * 60 * 60 * 1000));
      const hour = pstTime.getHours();

      let timeLabel = '';
      if (hour === 6) timeLabel = '6:23am PST';
      else if (hour === 12) timeLabel = '12:23pm PST';
      else if (hour === 18) timeLabel = '6:23pm PST';

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
  }

  // Start the cron service
  start(): void {
    console.log('🚀 Starting cron service...');

    // Check every minute
    setInterval(() => {
      this.checkAndRunCollection();
    }, 60000); // 60 seconds

    console.log('✅ Cron service started - checking for Rising Stars collection at 6:23am, 12:23pm, 6:23pm PST');
  }
} 