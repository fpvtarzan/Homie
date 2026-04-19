# Quick Start - Homie WhatsApp Bot

## TL;DR - Get Running in 5 Minutes

### 1. Get Meta Credentials (10 mins, one-time setup)

```bash
# Go to https://business.facebook.com
# Create Business Account
# Setup WhatsApp Business Account  
# Get these 4 values and save them:

WHATSAPP_PHONE_NUMBER_ID=102345678901234
WHATSAPP_ACCESS_TOKEN=EAABa5ZCvB2c0BA...
WHATSAPP_APP_SECRET=a1b2c3d4e5f6...
WHATSAPP_VERIFY_TOKEN=my_secret_token_123
```

Full setup guide: See `WHATSAPP_SETUP.md`

### 2. Setup Environment

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your credentials from step 1
# Add ANTHROPIC_API_KEY if using Claude features
nano .env
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# OR build and run
npm run build
npm start
```

Server runs at `http://localhost:3000`

### 4. Expose to Internet (for testing)

```bash
# Using ngrok (https://ngrok.com)
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
# Use this in next step
```

### 5. Configure Webhook in Meta

1. Go to Meta Developers > Your App > WhatsApp > Configuration
2. Set Webhook URL: `https://your-public-url.example.com/webhook`
3. Set Verify Token: (from your .env `WHATSAPP_VERIFY_TOKEN`)
4. Click Verify & Save
5. Subscribe to `messages` field

### 6. Test

Open WhatsApp, message your bot's number with:

```
hi
1
April 10-20
2 people
beginner
mid-range
```

Bot responds with activity recommendations!

## Project Structure

```
src/
├── index.ts                 # Express server
├── routes/
│   └── webhook.ts          # Meta webhook handler (handles messages)
├── agents/
│   ├── conversational.ts    # Chat logic & onboarding
│   ├── matcher.ts           # Activity matching
│   └── memory.ts            # User state persistence
├── types/
│   └── user.ts              # TypeScript interfaces
└── utils/
    └── twilio.ts            # Meta API client (renamed from twilio)
```

## Key Files Changed

| File | What Changed | Why |
|------|--------------|-----|
| `src/routes/webhook.ts` | Twilio → Meta webhook format | Handle Meta's message structure |
| `src/utils/twilio.ts` | TwiML → Meta API calls | Send messages via Meta API |
| `.env.example` | Twilio vars → Meta vars | New credentials needed |
| `package.json` | Removed `twilio` dependency | Not needed for Meta API |

## Environment Variables

```env
# Required for Meta WhatsApp API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_APP_SECRET=your_app_secret
WHATSAPP_VERIFY_TOKEN=your_custom_token

# Server
PORT=3000
NODE_ENV=development

# Optional: For Claude features
ANTHROPIC_API_KEY=sk-ant-...
```

## Common Commands

```bash
# Development
npm run dev          # Auto-reload on changes

# Build
npm run build        # Compile TypeScript

# Production
npm start            # Run compiled JS

# Clean
rm -rf dist          # Delete build artifacts
rm -rf node_modules  # Delete dependencies (then npm install)
```

## Testing

### Manual Testing (curl)

```bash
# Health check
curl http://localhost:3000/health

# Send test message to webhook
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "from": "1234567890",
            "text": { "body": "hello" }
          }],
          "contacts": [{
            "profile": { "name": "Test User" }
          }]
        }
      }]
    }]
  }'
```

### Real WhatsApp Testing

1. Add bot's phone number to contacts
2. Open WhatsApp
3. Send message: `hi`
4. Bot responds with onboarding

## Debugging

### Check Logs

```bash
# With npm run dev, logs print to console
# Look for:
# ✅ Bot started
# 📩 Incoming message (when user sends message)
# 📤 Sent WhatsApp message (when bot responds)
# ❌ Errors
```

### Common Issues

| Issue | Fix |
|-------|-----|
| `Cannot find module 'twilio'` | Run `npm install` |
| Port already in use | Change `PORT` in .env |
| `WHATSAPP_*` undefined | Check `.env` has all credentials |
| Webhook not verified | Check `WHATSAPP_VERIFY_TOKEN` matches Meta dashboard |
| Bot doesn't respond | Check server is running, webhook URL is correct |
| Message fails to send | Check `WHATSAPP_ACCESS_TOKEN` is valid (doesn't expire) |

## What's Implemented

✅ Webhook endpoint for incoming messages
✅ 5-question onboarding flow
✅ Activity recommendations based on preferences
✅ Conversation history tracking
✅ Meta signature validation
✅ Error handling & logging
✅ TypeScript types
✅ Message formatting with emoji

## What's NOT Implemented (Future Work)

- Message templates (for high-volume sending)
- Media support (images, documents, videos)
- Interactive buttons/lists
- Message status tracking (read receipts)
- AI-powered search (currently keyword matching)
- Database persistence (currently in-memory)

## Deployment Options

### Render.com (Free Tier)
1. Push code to GitHub
2. Connect Render to GitHub repo
3. Deploy
4. Use Render URL as webhook

### Heroku (Paid)
```bash
heroku create homie-bot
git push heroku main
```

### Railway (Free)
1. Connect GitHub
2. Deploy
3. Get public URL

### AWS Lambda (Serverless)
Requires refactoring to serverless handler

### DigitalOcean App Platform
1. Connect GitHub
2. Configure environment
3. Deploy

## Next Steps

1. **Complete setup** - Follow `WHATSAPP_SETUP.md` fully
2. **Test locally** - Follow verification checklist in `VERIFICATION_CHECKLIST.md`
3. **Deploy** - Push to production server
4. **Monitor** - Watch logs for errors/usage
5. **Improve** - Add features from "What's NOT Implemented"

## Support

- Setup questions? → See `WHATSAPP_SETUP.md`
- Testing? → See `VERIFICATION_CHECKLIST.md`
- Code changes? → See `MIGRATION_NOTES.md`
- API docs? → [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/)

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express 5
- **Language:** TypeScript
- **API Client:** Fetch (built-in Node.js)
- **Auth:** Bearer token via headers
- **Messaging:** WhatsApp Cloud API (Meta)

## License

ISC
