import cron from 'node-cron';
import { BroadcastService } from './broadcast';

/**
 * Scheduler service — runs broadcasts on Railway app directly
 * No external dependencies, runs inside the app
 */
export class SchedulerService {
  private broadcast: BroadcastService;
  private jobs: cron.ScheduledTask[] = [];

  constructor() {
    this.broadcast = new BroadcastService();
  }

  /**
   * Start all scheduled jobs
   */
  start(): void {
    console.log('🕐 Starting scheduler...');

    // 8am daily (Lisbon timezone = UTC+0/+1)
    // Cron format: minute hour day month weekday
    // 0 8 * * * = every day at 8:00 AM
    const forecastJob = cron.schedule('0 8 * * *', async () => {
      console.log('\n📊 [SCHEDULER] Running 8am surf forecast broadcast...');
      try {
        const result = await this.broadcast.sendSurfForecasts();
        console.log(`✅ Forecast broadcast: sent=${result.sent}, failed=${result.failed}`);
      } catch (error) {
        console.error('❌ Forecast broadcast failed:', error);
      }
    });

    // Every hour at 7 minutes past (to check for due check-ins)
    // 7 * * * * = at 7 minutes past every hour
    const checkinJob = cron.schedule('7 * * * *', async () => {
      console.log('\n🏄 [SCHEDULER] Running hourly check-in broadcast...');
      try {
        const result = await this.broadcast.sendDueCheckIns();
        console.log(`✅ Check-in broadcast: sent=${result.sent}, failed=${result.failed}`);
      } catch (error) {
        console.error('❌ Check-in broadcast failed:', error);
      }
    });

    this.jobs.push(forecastJob, checkinJob);
    console.log('✅ Scheduler started: 8am forecast + hourly check-ins\n');
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    this.jobs.forEach(job => job.stop());
    console.log('⏹️ Scheduler stopped');
  }
}
