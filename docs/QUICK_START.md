# Quick Start Guide - Get Running in 10 Minutes

Fast track to testing your Homie WhatsApp bot locally.

---

## Prerequisites

- Node.js 20+ installed
- npm installed
- Twilio account (free trial)

---

## Step 1: Get Twilio Credentials (5 minutes)

1. **Sign up for Twilio:**
   - Go to https://www.twilio.com/try-twilio
   - Create account (requires phone verification)

2. **Get credentials:**
   - Dashboard → Copy **Account SID** and **Auth Token**

3. **Join WhatsApp Sandbox:**
   - Go to https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
   - Send WhatsApp message to sandbox number with join code
   - Example: Text `join abc-123` to `+1 415 523 8886`

---

## Step 2: Configure Environment (1 minute)

Edit `.env` file in project root:

```bash
# Replace with YOUR credentials from Twilio Dashboard
TWILIO_ACCOUNT_SID=AC1234567890abcdef...
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

PORT=3000
NODE_ENV=development
```

**Save the file!**

---

## Step 3: Install Dependencies (2 minutes)

```bash
# If not already done
npm install
```

---

## Step 4: Start Server (1 minute)

```bash
npm run dev
```

**Expected output:**
```
🚀 Homie WhatsApp Bot is running!
📍 Server: http://localhost:3000
🔗 Webhook: http://localhost:3000/webhook
🏥 Health: http://localhost:3000/health

Environment: development
✅ Loaded 30 activities
```

✅ Server running!

---

## Step 5: Set Up Public URL (2 minutes)

Twilio needs a public HTTPS URL to reach your local server.

### Install ngrok:

```bash
# macOS
brew install ngrok

# Or download: https://ngrok.com/download
```

### Start ngrok tunnel:

```bash
# In a NEW terminal window
ngrok http 3000
```

**Copy the HTTPS URL** from output:
```
Forwarding: https://abc123def.ngrok.io -> http://localhost:3000
            ^^^^^^^^^^^^^^^^^^^^^^^^
            Copy this URL
```

---

## Step 6: Configure Twilio Webhook (1 minute)

1. Go to https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox
2. Scroll to **"Sandbox Configuration"**
3. In **"When a message comes in"** field, enter:
   ```
   https://abc123def.ngrok.io/webhook
   ```
4. Method: **POST**
5. Click **"Save"**

---

## Step 7: Test It! (2 minutes)

1. **Open WhatsApp** on your phone
2. **Go to your Twilio sandbox conversation**
3. **Send:** `Hi`

### Expected Conversation:

```
You: Hi

Bot: Welcome to Algarve Adventures! 👋

     I'll help you discover amazing activities in the Algarve region.

     Let's start! What brings you to the Algarve?

     1️⃣ Surfing & water sports
     2️⃣ Wellness & yoga retreats
     [...]

You: Surfing and yoga

Bot: Great choice! 🗓️
     When are you visiting?
```

**🎉 IT WORKS!**

Continue the conversation to complete onboarding and get activity recommendations.

---

## Troubleshooting

### "No response from bot"

**Check:**
1. Server running? (`npm run dev` terminal should show activity)
2. ngrok running? (Should show "Forwarding" URL)
3. Webhook URL correct in Twilio? (Must include `/webhook`)
4. Server logs show incoming message?

### "Invalid Twilio signature"

**Fix:**
- Restart server: `npm run dev`
- Check `.env` has correct `TWILIO_AUTH_TOKEN`

### "Error loading activities"

**Fix:**
- Verify file exists: `ls data/activities.json`
- Should return: `data/activities.json`

---

## What's Next?

✅ **Working Locally?** → Proceed to deployment:
- See: `docs/RAILWAY_DEPLOYMENT.md` (coming next)

✅ **Want to test more?** → See:
- `docs/TESTING_GUIDE.md` - Complete test suite

✅ **Issues?** → See:
- `docs/TWILIO_SETUP.md` - Detailed troubleshooting

---

## Clean Stop

When done testing:

1. Stop server: `Ctrl+C` in `npm run dev` terminal
2. Stop ngrok: `Ctrl+C` in ngrok terminal

---

**Total time: ~10 minutes from zero to working WhatsApp bot!** 🚀
