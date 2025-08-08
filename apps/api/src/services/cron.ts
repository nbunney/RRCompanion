import { FictionHistoryService } from './fictionHistory.ts';

export class CronService {
  private fictionHistoryService: FictionHistoryService;
  private lastRunDate: string | null = null;

  constructor() {
    this.fictionHistoryService = new FictionHistoryService();
  }

  // Check if it's time to run the nightly collection (12:23am PST)
  private shouldRunNightlyCollection(): boolean {
    const now = new Date();

    // Convert to PST (UTC-8)
    const pstTime = new Date(now.getTime() - (8 * 60 * 60 * 1000));

    const hour = pstTime.getUTCHours();
    const minute = pstTime.getUTCMinutes();
    const today = pstTime.toISOString().split('T')[0];

    // Check if it's 12:23am PST and we haven't run today
    if (hour === 0 && minute === 23 && this.lastRunDate !== today) {
      this.lastRunDate = today;
      return true;
    }

    return false;
  }

  // Check and run nightly collection if needed
  private async checkAndRunNightlyCollection(): Promise<void> {
    if (this.shouldRunNightlyCollection()) {
      console.log('🌙 Running nightly fiction history collection...');
      try {
        const success = await this.fictionHistoryService.runNightlyCollection();
        if (success) {
          console.log('✅ Nightly fiction history collection completed successfully');
        } else {
          console.error('❌ Nightly fiction history collection failed');
        }
      } catch (error) {
        console.error('❌ Error during nightly fiction history collection:', error);
      }
    }
  }

  // Start the cron service
  start(): void {
    console.log('🚀 Starting cron service...');

    // Check every minute
    setInterval(() => {
      this.checkAndRunNightlyCollection();
    }, 60000); // 60 seconds

    console.log('✅ Cron service started - checking for nightly collection at 12:23am PST');
  }
} 