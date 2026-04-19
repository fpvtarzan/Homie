import crypto from 'crypto';

/**
 * Initialize WhatsApp Cloud API client
 */
export function initializeWhatsAppClient(): { phoneNumberId: string; accessToken: string } {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN must be set in environment variables');
  }

  console.log('✅ WhatsApp Cloud API client initialized');

  return { phoneNumberId, accessToken };
}

/**
 * Send WhatsApp message via Meta Cloud API
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<void> {
  try {
    const { phoneNumberId, accessToken } = initializeWhatsAppClient();

    // Clean phone number (remove non-digits)
    const cleanedTo = to.replace(/\D/g, '');

    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanedTo,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send message: ${JSON.stringify(error)}`);
    }

    console.log(`📤 Sent WhatsApp message to ${to}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

/**
 * Validate Meta WhatsApp webhook signature
 */
export function validateWebhookSignature(
  signature: string,
  body: string
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.warn('WHATSAPP_APP_SECRET not set - skipping signature validation');
    return true; // Allow in development
  }

  const hash = crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex');

  const expectedSignature = `sha256=${hash}`;

  return signature === expectedSignature;
}
