#!/usr/bin/env node
/**
 * CLI script for scheduled broadcast tasks
 * Run with: npm run broadcast:forecast OR npm run broadcast:checkin
 */

import dotenv from 'dotenv';
import { BroadcastService } from '../services/broadcast';

dotenv.config();

async function main() {
  const command = process.argv[2];

  if (!command) {
    console.error('Usage: broadcast:forecast OR broadcast:checkin');
    process.exit(1);
  }

  const broadcast = new BroadcastService();

  try {
    if (command === 'forecast') {
      console.log('📊 Sending 8am surf forecasts...');
      const result = await broadcast.sendSurfForecasts();
      console.log(`✅ Sent: ${result.sent}, Failed: ${result.failed}`);
      console.log(`📅 Check-ins scheduled for:`, result.checkins);
    } else if (command === 'checkin') {
      console.log('🏄 Checking for due check-ins...');
      const result = await broadcast.sendDueCheckIns();
      console.log(`✅ Sent: ${result.sent}, Failed: ${result.failed}`);
    } else {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
