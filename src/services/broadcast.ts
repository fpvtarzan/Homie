import fs from 'fs/promises';
import path from 'path';
import { UserProfile } from '../types/user';
import { SurfAgent } from '../agents/surf-agent';
import { sendWhatsAppMessage } from '../utils/twilio';

/**
 * Broadcast service — send messages to all active users
 */
export class BroadcastService {
  private userDataDir: string;
  private surfAgent: SurfAgent;

  constructor() {
    this.userDataDir = path.join(process.cwd(), 'data', 'users');
    this.surfAgent = new SurfAgent();
  }

  /**
   * Send 8am surf forecast to all active users
   */
  async sendSurfForecasts(): Promise<{ sent: number; failed: number; checkins: Array<{ phone: string; time: string }> }> {
    try {
      const users = await this.getAllActiveUsers();
      let sent = 0;
      let failed = 0;
      const checkins: Array<{ phone: string; time: string }> = [];

      for (const user of users) {
        try {
          // Generate forecast for this user's skill level
          const forecast = await this.surfAgent.generateMorningForecast(user.preferences);

          // Send forecast
          await sendWhatsAppMessage(user.phoneNumber, forecast);
          sent++;

          // Extract tide time from forecast (simplified: assume format includes tide time)
          const tideTime = this.extractTideTime(forecast);
          if (tideTime) {
            const checkInTime = this.addHours(tideTime, 5);
            user.checkInScheduledFor = checkInTime;
            checkins.push({ phone: user.phoneNumber, time: checkInTime });

            // Save updated user profile
            await this.saveUserProfile(user);
          }

          console.log(`✅ Forecast sent to ${user.phoneNumber}`);
        } catch (error) {
          console.error(`❌ Failed to send forecast to ${user.phoneNumber}:`, error);
          failed++;
        }
      }

      return { sent, failed, checkins };
    } catch (error) {
      console.error('Error sending surf forecasts:', error);
      return { sent: 0, failed: 0, checkins: [] };
    }
  }

  /**
   * Send check-in messages to users whose time has come
   */
  async sendDueCheckIns(): Promise<{ sent: number; failed: number }> {
    try {
      const users = await this.getAllActiveUsers();
      let sent = 0;
      let failed = 0;
      const now = new Date();

      for (const user of users) {
        if (!user.checkInScheduledFor) continue;

        const checkInTime = new Date(user.checkInScheduledFor);
        if (now >= checkInTime) {
          try {
            // Extract other interests for activity suggestion
            const otherActivities = (user.preferences.interests || []).filter(i => i !== 'surfing');

            // Generate check-in message
            const checkIn = await this.surfAgent.generateCheckIn(user.preferences, otherActivities);

            // Send check-in
            await sendWhatsAppMessage(user.phoneNumber, checkIn);
            sent++;

            // Clear check-in time
            user.checkInScheduledFor = undefined;
            await this.saveUserProfile(user);

            console.log(`✅ Check-in sent to ${user.phoneNumber}`);
          } catch (error) {
            console.error(`❌ Failed to send check-in to ${user.phoneNumber}:`, error);
            failed++;
          }
        }
      }

      return { sent, failed };
    } catch (error) {
      console.error('Error sending check-ins:', error);
      return { sent: 0, failed: 0 };
    }
  }

  /**
   * Get all active users
   */
  private async getAllActiveUsers(): Promise<UserProfile[]> {
    try {
      const files = await fs.readdir(this.userDataDir);
      const users: UserProfile[] = [];

      for (const file of files) {
        if (file.endsWith('.json') && !file.includes('_onboarding')) {
          const filePath = path.join(this.userDataDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const user = JSON.parse(data) as UserProfile;

          // Only include active users (not churned)
          if (user.conversationState !== 'churned') {
            users.push(user);
          }
        }
      }

      return users;
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  /**
   * Save user profile
   */
  private async saveUserProfile(user: UserProfile): Promise<void> {
    const filePath = path.join(this.userDataDir, `${user.userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf-8');
  }

  /**
   * Extract tide time from forecast message (simplified)
   */
  private extractTideTime(forecast: string): string | null {
    // Look for pattern like "15:30" or "3:30 PM"
    const match = forecast.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return match[0];
    }
    return null;
  }

  /**
   * Add hours to a time string and return ISO timestamp
   */
  private addHours(timeStr: string, hours: number): string {
    const [hoursStr, minsStr] = timeStr.split(':');
    let h = parseInt(hoursStr) + hours;
    const m = parseInt(minsStr);

    // Handle day overflow
    if (h >= 24) {
      h -= 24;
    }

    const now = new Date();
    const checkInDate = new Date(now);
    checkInDate.setHours(h, m, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (checkInDate < now) {
      checkInDate.setDate(checkInDate.getDate() + 1);
    }

    return checkInDate.toISOString();
  }
}
