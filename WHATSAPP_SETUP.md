# WhatsApp Cloud API Setup Guide

This guide walks you through setting up the Homie WhatsApp Bot to use Meta's WhatsApp Cloud API instead of Twilio.

## Prerequisites

- A Meta Business Account (free to create)
- A WhatsApp Business Account
- A phone number to use with WhatsApp Business (can be a test number)
- A public URL to expose your webhook (ngrok for testing, or a deployed server)

## Step-by-Step Setup

### 1. Create Meta Business Account

1. Go to [business.facebook.com](https://business.facebook.com)
2. Click "Create Account"
3. Fill in your business name, email, and business purpose
4. Complete the setup wizard
5. Note your **Business Account ID** (you'll need this)

### 2. Set Up WhatsApp Business Account

1. In Business Manager, go to **All Tools** > **WhatsApp Manager**
2. Click **Start using WhatsApp Business**
3. Choose your region and accept the terms
4. You'll be guided to create/link a WhatsApp Business Account

### 3. Create or Link a Phone Number

**Option A: Use a Test Phone Number (fastest for testing)**
1. In WhatsApp Manager, go to **Phone Numbers**
2. Click **Add Phone Number**
3. Select **Add test phone number**
4. Meta will assign you a test number (like `+1-XXX-XXX-XXXX`)
5. Note this number as your **Phone Number ID** (you'll see it in the UI)

**Option B: Use Your Own Phone Number (production)**
1. Go to **Phone Numbers** > **Add Phone Number**
2. Follow the verification process (SMS or call)
3. Complete business verification if not already done
4. Note your **Phone Number ID**

### 4. Get Your Access Token

1. In Business Manager, go to **Settings** > **User Roles**
2. Click on your user
3. Scroll to **System User Access Tokens**
4. Click **Create Token**
5. Select **WhatsApp** as the app
6. Select all relevant permissions (esp. `whatsapp_business_messaging`)
7. Copy the **Access Token** - save it securely, it won't be shown again

Alternative (simpler):
1. Go to Business Manager > **Apps & Websites** > **Your Apps**
2. Find your WhatsApp app
3. Go to **Settings** > **Basic** > **App Secret**
4. Generate a new token if needed

### 5. Get Your App Secret (for webhook signature validation)

1. In Meta Developers site, go to **My Apps** > Select your app
2. Go to **Settings** > **Basic**
3. Copy your **App Secret** (keep this safe)

### 6. Create a Verify Token (for webhook subscription)

This is a custom token YOU create (not from Meta). Choose something secure:

```bash
# Example (don't use this in production)
WHATSAPP_VERIFY_TOKEN=my_super_secret_verify_token_12345
```

### 7. Configure Environment Variables

Create/update your `.env` file:

```env
# WhatsApp Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_APP_SECRET=your_app_secret_here
WHATSAPP_VERIFY_TOKEN=my_super_secret_verify_token_12345

# Server
PORT=3000
NODE_ENV=development

# Claude API
ANTHROPIC_API_KEY=your_claude_api_key_here
```

**Example with real-looking values:**
```env
WHATSAPP_PHONE_NUMBER_ID=102345678901234
WHATSAPP_ACCESS_TOKEN=EAABa5ZCvB2c0BAD5ZCvB2c0BA1DZCvB2c0BA...
WHATSAPP_APP_SECRET=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
WHATSAPP_VERIFY_TOKEN=homie_bot_secret_2024

PORT=3000
NODE_ENV=production
ANTHROPIC_API_KEY=sk-ant-...
```

### 8. Deploy & Get Public URL

**Option A: ngrok (for testing)**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
```

**Option B: Deploy to Render, Heroku, Railway, or similar**
- Deploy the app
- Get your public URL: `https://your-app.example.com`

### 9. Configure Webhook in Meta Dashboard

1. Go to Meta Developers > **My Apps** > Your WhatsApp App
2. Go to **Configuration** > **Webhooks**
3. Click **Edit** next to Webhooks
4. In the callback URL field, enter:
   ```
   https://your-public-url.example.com/webhook
   ```
   (Replace with your actual URL from step 8)

5. In the **Verify Token** field, enter the token you created in step 6:
   ```
   my_super_secret_verify_token_12345
   ```

6. Click **Verify and Save**
   - Meta will send a GET request to verify the webhook
   - Your app should respond with 200 and echo the challenge
   - You should see "✅ Webhook verified by Meta" in your logs

7. Under **Webhook Fields**, make sure these are subscribed:
   - ✅ `messages`
   - ✅ `message_status` (optional, for read receipts)

### 10. Run the Bot Locally/Deploy

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# OR build and run production
npm run build
npm start
```

### 11. Test End-to-End

1. Open WhatsApp (mobile or desktop)
2. Search for your bot's phone number (from step 3)
3. Send a message: `hi`
4. You should see:
   - Message logged in your console: `📩 Incoming message`
   - Bot responds with onboarding question 1
   - You receive the bot's response

5. Continue the onboarding flow:
   - Message: `1` (for interests)
   - Bot asks about dates
   - Continue through all 5 questions
   - Bot provides activity recommendations

### 12. Monitor & Debug

**Check logs:**
```bash
# If running locally with npm run dev
# Check your terminal for console.log output
```

**Common issues:**

| Issue | Solution |
|-------|----------|
| Webhook not verified | Check verify token matches exactly, check server is running & accessible |
| Message not received by bot | Check `X-Hub-Signature-256` header validation isn't too strict in dev |
| Message not sent back | Check `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` are correct |
| 403 Forbidden on webhook | Signature validation failed - check app secret is correct |
| 401 Unauthorized when sending | Access token is invalid or expired - regenerate |

## API Limits & Quotas

Meta's WhatsApp Cloud API has rate limits:

- **Free tier:** 1,000 messages/day
- **Tier 2:** 10,000 messages/day (after verification)
- **Higher tiers:** Available with business account verification

## Security Notes

1. **Never commit `.env` file** - it contains sensitive tokens
2. **Rotate tokens regularly** - Meta provides token rotation in Business Manager
3. **Validate signatures** - always verify X-Hub-Signature-256 header in production
4. **Rate limit outgoing messages** - implement backoff if hitting quota limits
5. **Sanitize user input** - the bot does basic parsing but be careful with untrusted data

## Next Steps (Post-Launch)

1. **Collect metrics** - track message volume, user retention, response times
2. **Improve NLP** - currently doing simple keyword matching, consider Claude AI for better understanding
3. **Add media support** - WhatsApp Cloud API supports images, videos, documents
4. **Implement message templates** - for common responses like welcome, menu, etc.
5. **Scale infrastructure** - once live, monitor performance and scale as needed

## Useful Links

- [Meta WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Webhook Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-example)
- [Message Types](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/message-types)
- [Rate Limits](https://developers.facebook.com/docs/whatsapp/cloud-api/rate-limits)
- [Business Account Requirements](https://www.whatsapp.com/business/guide/)

## Support

If you run into issues:
1. Check the console logs for error messages
2. Verify all credentials in `.env`
3. Test webhook with curl:
   ```bash
   curl -X POST http://localhost:3000/webhook \
     -H "Content-Type: application/json" \
     -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"field":"messages","value":{"messages":[{"from":"1234567890","text":{"body":"test"}}],"contacts":[{"profile":{"name":"Test User"}}]}}]}]}'
   ```
4. Check Meta's webhook logs in Business Manager for delivery status
