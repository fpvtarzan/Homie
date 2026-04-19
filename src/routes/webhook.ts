import { Router, Request, Response } from 'express';
import { ConversationalAgent } from '../agents/conversational';
import { validateWebhookSignature, sendWhatsAppMessage } from '../utils/twilio';
import { BroadcastService } from '../services/broadcast';

const router = Router();
const agent = new ConversationalAgent();

// Simple dedup: track recently processed message IDs (prevents Meta retries)
const processedMessages = new Set<string>();
const MAX_PROCESSED = 1000;

function markProcessed(messageId: string): boolean {
  if (processedMessages.has(messageId)) return false; // already seen
  processedMessages.add(messageId);
  // Prevent memory leak — trim old entries
  if (processedMessages.size > MAX_PROCESSED) {
    const first = processedMessages.values().next().value;
    if (first) processedMessages.delete(first);
  }
  return true; // first time seeing this
}

// POST /webhook - Handle incoming WhatsApp messages from Meta
router.post('/', async (req: Request, res: Response) => {
  // Always respond 200 immediately to prevent Meta retries
  res.status(200).json({ received: true });

  try {
    const body = req.body;

    // Only process WhatsApp Business Account events
    if (body.object !== 'whatsapp_business_account') return;

    const entry = body.entry?.[0];
    if (!entry) return;

    const changes = entry.changes?.[0];
    if (!changes || changes.field !== 'messages') return;

    const value = changes.value;

    // IGNORE status updates (delivered, read, sent receipts)
    if (value?.statuses) {
      console.log('📬 Status update (ignoring):', value.statuses[0]?.status);
      return;
    }

    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message || !contact) return;

    // Dedup: skip if we already processed this message
    const messageId = message.id;
    if (messageId && !markProcessed(messageId)) {
      console.log(`⏭️ Duplicate message ${messageId}, skipping`);
      return;
    }

    // Only handle text messages for now
    const messageText = message.text?.body;
    if (!messageText) {
      console.log(`⏭️ Non-text message type: ${message.type}, skipping`);
      return;
    }

    const from = message.from;
    const senderName = contact.profile?.name || 'User';

    console.log(`\n📩 Message from ${senderName} (${from}): ${messageText}`);

    // Process with AI agent
    const response = await agent.processMessage(from, messageText);

    // Send reply
    try {
      await sendWhatsAppMessage(from, response);
      console.log(`📤 Reply sent to ${from}`);
    } catch (sendError) {
      console.error('Failed to send reply:', sendError);
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
  }
});

// GET /webhook - Meta verification
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verified by Meta');
    res.status(200).send(challenge as string);
  } else if (mode === 'subscribe') {
    console.error(`❌ Token mismatch: got "${token}", expected "${verifyToken}"`);
    res.status(403).send('Forbidden');
  } else {
    res.status(200).json({ status: 'active' });
  }
});

// POST /webhook/broadcast/forecast - Send 8am surf forecasts to all users
router.post('/broadcast/forecast', async (req: Request, res: Response) => {
  res.status(200).json({ status: 'processing' });

  try {
    const broadcast = new BroadcastService();
    console.log('\n🏄 Running 8am surf forecast broadcast...');
    const result = await broadcast.sendSurfForecasts();
    console.log(`✅ Forecast broadcast complete: sent=${result.sent}, failed=${result.failed}`);
    console.log(`📅 Check-ins scheduled:`, result.checkins);
  } catch (error) {
    console.error('❌ Forecast broadcast error:', error);
  }
});

// POST /webhook/broadcast/checkin - Send check-in messages to users whose time is due
router.post('/broadcast/checkin', async (req: Request, res: Response) => {
  res.status(200).json({ status: 'processing' });

  try {
    const broadcast = new BroadcastService();
    console.log('\n🏄 Running surf check-in broadcast...');
    const result = await broadcast.sendDueCheckIns();
    console.log(`✅ Check-in broadcast complete: sent=${result.sent}, failed=${result.failed}`);
  } catch (error) {
    console.error('❌ Check-in broadcast error:', error);
  }
});

export default router;
