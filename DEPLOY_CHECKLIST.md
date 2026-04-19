# Deployment Checklist for Anton

## Pre-Deployment (Before Going Live)

### Code Review
- [ ] All 4 refactored files reviewed:
  - [ ] `src/routes/webhook.ts` - Handles Meta format, not Twilio
  - [ ] `src/utils/twilio.ts` - Sends via Meta API, not Twilio client
  - [ ] `.env.example` - Has Meta vars, no Twilio vars
  - [ ] `package.json` - No `twilio` dependency
- [ ] Build succeeds: `npm run build` ✅
- [ ] No TypeScript errors
- [ ] Conversation logic unchanged (only I/O refactored)

### Documentation Review
Read these in order:
1. [ ] `REFACTOR_SUMMARY.md` - Understand what changed and why
2. [ ] `WHATSAPP_SETUP.md` - Complete step-by-step setup
3. [ ] `QUICKSTART.md` - Quick reference guide
4. [ ] `VERIFICATION_CHECKLIST.md` - Test cases to verify
5. [ ] `MIGRATION_NOTES.md` - Technical reference if needed

## Setup Phase (30 mins)

### Meta Credentials
Follow `WHATSAPP_SETUP.md` steps 1-7:
- [ ] Create Meta Business Account (free)
- [ ] Setup WhatsApp Business Account
- [ ] Create/link phone number (get Phone Number ID)
- [ ] Generate Access Token
- [ ] Get App Secret
- [ ] Create Verify Token (you choose the value)

### Environment Configuration
- [ ] Create `.env` file (copy from `.env.example`)
- [ ] Add all 4 credentials:
  ```
  WHATSAPP_PHONE_NUMBER_ID=________
  WHATSAPP_ACCESS_TOKEN=________
  WHATSAPP_APP_SECRET=________
  WHATSAPP_VERIFY_TOKEN=________
  ```
- [ ] Add server config:
  ```
  PORT=3000
  NODE_ENV=production
  ```
- [ ] Add Claude API key if needed:
  ```
  ANTHROPIC_API_KEY=sk-ant-________
  ```
- [ ] Save `.env` securely (NOT in git, add to `.gitignore`)

### Local Testing (10 mins)
- [ ] Run `npm install` (removes extraneous twilio)
- [ ] Run `npm run build` (verify TypeScript)
- [ ] Run `npm run dev` (start dev server)
- [ ] Verify startup logs show:
  - `🚀 Homie WhatsApp Bot is running!`
  - `📍 Server: http://localhost:3000`
  - `🔗 Webhook: http://localhost:3000/webhook`
- [ ] Test health endpoint: `curl http://localhost:3000/health`

## Deployment Phase

### Choose Hosting

Pick one option and deploy:

#### Option A: ngrok (for testing only)
```bash
ngrok http 3000
# Copy the forwarding URL: https://abc123.ngrok.io
```

#### Option B: Render.com (Recommended - Free Tier)
1. Push code to GitHub
2. Connect Render to GitHub repo
3. Create Web Service
4. Set environment variables in Render dashboard (from your `.env`)
5. Deploy
6. Get URL: `https://homie-bot.onrender.com`

#### Option C: Railway.app
1. Link GitHub repo
2. Set environment variables
3. Deploy
4. Get URL: `https://homie-bot.up.railway.app`

#### Option D: Heroku (Requires Credit Card)
```bash
heroku login
heroku create homie-bot
heroku config:set WHATSAPP_PHONE_NUMBER_ID=...
heroku config:set WHATSAPP_ACCESS_TOKEN=...
heroku config:set WHATSAPP_APP_SECRET=...
heroku config:set WHATSAPP_VERIFY_TOKEN=...
git push heroku main
heroku logs --tail
```

### Webhook Configuration in Meta
Follow `WHATSAPP_SETUP.md` step 9:
- [ ] Go to Meta Business Manager > Your App > WhatsApp > Configuration
- [ ] Set Webhook URL:
  ```
  https://your-deployed-url.com/webhook
  ```
- [ ] Set Verify Token:
  ```
  (value from your WHATSAPP_VERIFY_TOKEN env var)
  ```
- [ ] Click "Verify and Save"
- [ ] Console shows: `✅ Webhook verified by Meta`
- [ ] Subscribe to `messages` field

### Verify Deployment
- [ ] Server is running on public URL
- [ ] Health endpoint accessible: `curl https://your-url.com/health`
- [ ] Webhook endpoint accessible: `curl https://your-url.com/webhook`
- [ ] Logs available (Render/Railway/Heroku dashboards)

## End-to-End Testing (20 mins)

Follow `VERIFICATION_CHECKLIST.md`:

### Test 1: Basic Message
1. Open WhatsApp (mobile, desktop, or web)
2. Find bot by phone number
3. Send: `hi`
4. **Expected:** Bot responds with onboarding question 1 (interests)
   - [ ] Message received in < 5 seconds
   - [ ] Bot says welcome message
   - [ ] Shows activity options with numbers

### Test 2: Complete Onboarding
Send these in sequence:
1. `1` (surfing)
   - [ ] Bot asks: When are you visiting?

2. `April 15-20`
   - [ ] Bot asks: How many people?

3. `2 people`
   - [ ] Bot asks: What's your skill level?

4. `beginner`
   - [ ] Bot asks: What's your budget?

5. `mid-range`
   - [ ] Bot responds with recommendations (at least 1 activity)
   - [ ] Response includes price, phone, location

### Test 3: Active Commands
After onboarding:
1. Send: `more`
   - [ ] Different activities shown

2. Send: `restart`
   - [ ] Back to question 1

3. Send: `#1`
   - [ ] Bot acknowledges (feature coming soon is OK for MVP)

### Test 4: Multiple Users
- [ ] Test with 3-5 different phone numbers
- [ ] Each user gets separate conversation state
- [ ] No crosstalk between users

## Monitoring & Logs

### Check Logs Regularly
- **Render:** Dashboard > Logs tab
- **Railway:** Deployments > Logs
- **Heroku:** `heroku logs --tail`

### Look for
- ✅ `📩 Incoming message` - User sent message
- ✅ `📤 Sent WhatsApp message` - Bot responded
- ✅ `✅ Webhook verified by Meta` - Verification successful

### Watch for Errors
- ❌ `Invalid Meta webhook signature` - Wrong app secret
- ❌ `Failed to send message` - Wrong credentials
- ❌ `Cannot find module` - Missing dependency
- ❌ `WHATSAPP_*` undefined - Missing env var

## Scaling Considerations

### Rate Limits
- Free tier: 1,000 messages/day
- Once you hit limit, messages queue
- Consider applying for higher tier: https://developers.facebook.com/docs/whatsapp/cloud-api/rate-limits

### Performance
- Current implementation: in-memory storage (no persistence)
- For production with many users: implement database
- For high volume: consider message queue (e.g., RabbitMQ, Redis)

## Security Checklist

- [ ] `.env` NOT committed to git (add to `.gitignore`)
- [ ] Sensitive values use environment variables, not hardcoded
- [ ] Webhook signature validation enabled
- [ ] HTTPS only (all public URLs use `https://`)
- [ ] Access token rotated periodically (in Meta dashboard)
- [ ] App secret never logged or exposed

## Post-Deployment

### First 24 Hours
- [ ] Monitor logs for errors
- [ ] Test message flow manually
- [ ] Verify response times < 5 seconds
- [ ] Check no crash loops (Render/Railway health checks)

### First Week
- [ ] Monitor usage patterns
- [ ] Watch for rate limit errors
- [ ] Collect metrics:
  - Messages sent/received
  - User retention
  - Common errors
- [ ] Document any issues

### Ongoing
- [ ] Review logs weekly
- [ ] Rotate tokens monthly
- [ ] Monitor CPU/memory usage
- [ ] Plan scaling if needed

## Troubleshooting

### Webhook Not Verified
```
Issue: "Invalid verify token" when setting up webhook in Meta
Fix: Double-check WHATSAPP_VERIFY_TOKEN value matches exactly
     Must be the same in .env and Meta dashboard
```

### Bot Not Responding
```
Issue: Send message, bot doesn't reply
Fix: 1. Check server is running: curl https://your-url.com/health
     2. Check logs for errors
     3. Verify webhook URL in Meta matches deployed URL
     4. Check all 4 env vars are set correctly
```

### Messages Not Sending
```
Issue: "Failed to send message" errors in logs
Fix: 1. Verify WHATSAPP_ACCESS_TOKEN is current (tokens expire)
     2. Regenerate token in Meta Business Manager
     3. Check phone number isn't blacklisted
```

### 401 Unauthorized
```
Issue: Access token errors
Fix: Generate new token in Meta Business Manager
     Update WHATSAPP_ACCESS_TOKEN in deployment environment
```

### Rate Limit Errors
```
Issue: "Rate limit exceeded" after ~1000 messages
Fix: This is normal on free tier
     Option 1: Wait 24 hours
     Option 2: Apply for higher tier in Meta developer console
```

## Rollback Plan

If serious issues occur:

### Quick Rollback
```bash
# For git-based deployments (Render, Railway, Heroku)
git revert <latest-commit>
git push origin main

# Render/Railway will auto-redeploy
# Heroku: git push heroku main
```

### Manual Rollback
If git rollback fails:
1. Stop current deployment
2. Revert `.env` to old Twilio values
3. Run `npm install twilio@^5.12.2`
4. Check out old `src/routes/webhook.ts` and `src/utils/twilio.ts`
5. Deploy old version

### Data Loss Assessment
- Current implementation: in-memory storage, no persistence
- User data is cleared on server restart
- No data loss on rollback

## Success Criteria

✅ Bot is live when ALL these are true:

1. Server running on public URL
2. Webhook URL registered in Meta and verified
3. User sends message → Bot receives it in logs
4. Bot processes through conversation agent
5. Bot sends response back to user via Meta API
6. User receives response in < 5 seconds
7. Onboarding flow completes successfully
8. Multiple users can interact simultaneously
9. No error logs in past hour
10. Health endpoint returns 200 OK

## Sign-Off

```
Deployed by: _______________
Date: _______________
Public URL: _______________
Bot Phone Number: _______________

Testing completed: [ ]
Ready for production: [ ]
Issues found: _______________
Notes: _______________
```

---

**Remember:** If anything fails, check the logs first. The logs will tell you exactly what went wrong.

**Support:** Need help?
- Setup questions → See `WHATSAPP_SETUP.md`
- Test failures → See `VERIFICATION_CHECKLIST.md`
- Technical questions → See `MIGRATION_NOTES.md`
- Code changes → See `REFACTOR_SUMMARY.md`
