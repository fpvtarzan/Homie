# Twilio WhatsApp Integration Setup Guide

Complete step-by-step guide to integrate your Homie bot with Twilio WhatsApp.

## Prerequisites

- Twilio account (free trial available)
- Credit card for account verification (Twilio requires it even for free tier)
- Phone number that can receive SMS for verification

---

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Click **"Sign up and start building"**
3. Fill in your details:
   - First Name
   - Last Name
   - Email
   - Password
4. Click **"Start your free trial"**
5. **Verify your email** (check inbox)
6. **Verify your phone number** via SMS

---

## Step 2: Get Your Twilio Credentials

After logging in to the Twilio Console:

1. Go to https://console.twilio.com
2. You'll see your **Dashboard** with:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click "Show" to reveal)

3. **Copy these credentials** - you'll need them for `.env` file

---

## Step 3: Set Up WhatsApp Sandbox (Quickest for Testing)

The WhatsApp Sandbox lets you test immediately without waiting for approval.

### Enable Sandbox:

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
   - Direct link: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

2. You'll see:
   - **Sandbox phone number**: `+1 415 523 8886` (or similar)
   - **Join code**: Something like `join <unique-code>`

3. **Join the sandbox** from your phone:
   - Open WhatsApp on your phone
   - Send a message to: `+1 415 523 8886`
   - Message content: `join <your-unique-code>`
   - You'll receive a confirmation: "Sandbox activated!"

### Configure Webhook:

Still on the Sandbox page:

1. Scroll down to **"Sandbox Configuration"**
2. Find **"When a message comes in"** field
3. You'll enter your webhook URL here (see Step 5 below)

---

## Step 4: Update Your .env File

Edit `/Users/antonlilljegren/Documents/Drone/Homie/.env`:

```bash
# From Twilio Console Dashboard
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN

# From Twilio Sandbox (include "whatsapp:" prefix)
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Server config
PORT=3000
NODE_ENV=development
```

**Important:**
- Keep `TWILIO_AUTH_TOKEN` secret (never commit to git)
- The phone number must include `whatsapp:` prefix
- Replace values with YOUR actual Twilio credentials

---

## Step 5: Set Up Webhook URL

You need a **public HTTPS URL** for Twilio to send messages to your server.

### Option A: Local Testing with ngrok (Recommended for Development)

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Start your local server:**
   ```bash
   npm run dev
   # Server runs on http://localhost:3000
   ```

3. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** from ngrok output:
   ```
   Forwarding  https://abc123.ngrok.io -> http://localhost:3000
                     ↑ Copy this URL
   ```

5. **Configure Twilio webhook:**
   - Go back to Twilio Console → WhatsApp Sandbox
   - In "When a message comes in" field, enter:
     ```
     https://abc123.ngrok.io/webhook
     ```
   - Method: **POST**
   - Click **"Save"**

### Option B: Deploy to Railway (Production)

If you want a permanent URL without ngrok:

1. **Deploy to Railway** (see RAILWAY_DEPLOYMENT.md)
2. Get your Railway URL: `https://your-app.railway.app`
3. Configure Twilio webhook:
   ```
   https://your-app.railway.app/webhook
   ```

---

## Step 6: Test the Integration

### Test Message Flow:

1. **Ensure your server is running:**
   ```bash
   npm run dev
   # You should see: "🚀 Homie WhatsApp Bot is running!"
   ```

2. **Send a test message via WhatsApp:**
   - Open WhatsApp on your phone
   - Go to your conversation with the Twilio sandbox number
   - Type: `Hi`
   - Send

3. **Expected behavior:**
   - Your server logs show: `📩 Incoming message`
   - Bot responds with welcome message and first question
   - You see the onboarding flow start!

### Test Webhook Directly:

```bash
# Test webhook is accessible
curl https://your-ngrok-url.ngrok.io/webhook

# Should return:
# {"message":"Webhook endpoint is active","method":"POST required for Twilio webhooks"}
```

---

## Step 7: Complete Onboarding Test

Have a full conversation with your bot:

```
You: Hi
Bot: Welcome to Algarve Adventures! 👋
     What brings you to the Algarve?
     1️⃣ Surfing & water sports
     [...]

You: Surfing and yoga
Bot: Great choice! 🗓️ When are you visiting?

You: April 10-17
Bot: Perfect! 👥 How many people are in your group?

You: 2 adults
Bot: Awesome! 🏄 What's your experience level?

You: Beginner
Bot: Last question! 💰 What's your budget preference?

You: Mid-range
Bot: Here are my top 5 recommendations:
     1️⃣ **Soul & Surf Portugal** (Luz, Lagos)
     [Activity details with contact info]
```

**Success!** ✅ Your bot is now fully operational!

---

## Troubleshooting

### Problem: "Invalid Twilio signature"

**Solution:**
- Check your `TWILIO_AUTH_TOKEN` in `.env` is correct
- Ensure ngrok URL in Twilio webhook matches exactly
- Try restarting your server: `npm run dev`

### Problem: Bot doesn't respond

**Check:**
1. Server is running (`npm run dev`)
2. ngrok tunnel is active (`ngrok http 3000`)
3. Twilio webhook URL is correct (includes `/webhook`)
4. Server logs show incoming messages

### Problem: "Error loading activities"

**Solution:**
- Verify `/data/activities.json` exists
- Check file has valid JSON
- Restart server

### Problem: Messages delayed or not sending

**Check:**
- Twilio account status (not suspended)
- Free trial credits remaining
- Server error logs: `console.log` output

---

## Next Steps After Testing

### 1. Apply for Production WhatsApp Number

Once testing works:

1. Go to Twilio Console → **Messaging** → **Senders** → **WhatsApp senders**
2. Click **"Request to enable your Twilio number for WhatsApp"**
3. Fill out the form:
   - Business name
   - Business website
   - Use case description
   - Estimated monthly volume
4. Wait 1-3 days for approval

### 2. Update Production Webhook

After getting approved WhatsApp number:

1. Go to **Messaging** → **Settings** → **WhatsApp Sender**
2. Configure webhook for your production number:
   ```
   https://your-app.railway.app/webhook
   ```

### 3. Update .env for Production

```bash
TWILIO_PHONE_NUMBER=whatsapp:+14155551234  # Your approved number
NODE_ENV=production
```

---

## Cost Information

### Free Trial:
- $15 free credit
- ~$0.005 per message (send + receive)
- Good for ~1,500 messages for testing

### Production Pricing:
- WhatsApp Business API: $0.005/message (US)
- International varies by country
- No monthly fees
- Pay-as-you-go

**Budget Estimate:**
- 100 users × 20 messages avg = 2,000 messages
- Cost: 2,000 × $0.005 = **$10/month**

---

## Security Best Practices

✅ **Do:**
- Keep `.env` in `.gitignore` (already configured)
- Use environment variables for all secrets
- Enable webhook signature validation (already implemented)
- Use HTTPS for webhooks (Railway/ngrok provide this)

❌ **Don't:**
- Commit `.env` to git
- Share your Auth Token publicly
- Use HTTP for webhooks in production
- Hardcode credentials in code

---

## Resources

- **Twilio WhatsApp API Docs**: https://www.twilio.com/docs/whatsapp
- **Twilio Console**: https://console.twilio.com
- **ngrok Documentation**: https://ngrok.com/docs
- **Twilio Support**: https://support.twilio.com

---

## Quick Reference

| Item | Value |
|------|-------|
| **Twilio Console** | https://console.twilio.com |
| **Sandbox Number** | +1 415 523 8886 (or your region) |
| **Local Server** | http://localhost:3000 |
| **Webhook Endpoint** | `/webhook` (POST) |
| **Health Check** | `/health` (GET) |
| **Message Format** | WhatsApp → Twilio → Your Server → Bot → Twilio → WhatsApp |

---

**You're all set!** 🎉 Your Homie WhatsApp bot is now integrated with Twilio and ready to help travelers discover Algarve activities.
