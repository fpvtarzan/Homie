# Verification Checklist - WhatsApp Bot

Use this checklist to verify the bot is working correctly after deployment.

## Pre-Launch Checks

### Environment & Build
- [ ] All dependencies installed (`npm install` completed)
- [ ] Code builds without errors (`npm run build` passes)
- [ ] `.env` file created with all required credentials:
  - [ ] `WHATSAPP_PHONE_NUMBER_ID` set
  - [ ] `WHATSAPP_ACCESS_TOKEN` set
  - [ ] `WHATSAPP_APP_SECRET` set
  - [ ] `WHATSAPP_VERIFY_TOKEN` set
  - [ ] `PORT` set (default 3000)
  - [ ] `ANTHROPIC_API_KEY` set
- [ ] No Twilio credentials remain in `.env` or code

### Webhook Configuration
- [ ] Webhook URL registered in Meta Business Manager (`/webhook` endpoint)
- [ ] Verify token matches exactly in Meta dashboard
- [ ] Webhook endpoint is publicly accessible (test with curl or browser)
- [ ] GET /webhook returns health check response
- [ ] Webhook has subscribed to `messages` field

### Code Verification
- [ ] `src/routes/webhook.ts` updated to handle Meta format
- [ ] `src/utils/twilio.ts` refactored for Meta API
- [ ] No imports of `twilio` package remain (except in tests)
- [ ] Package.json no longer depends on `twilio`
- [ ] Signature validation uses `X-Hub-Signature-256` header (not Twilio format)

## Post-Deployment Checks

### Server Health
- [ ] Server starts without errors:
  ```bash
  npm start
  # OR
  npm run dev
  ```
- [ ] Console shows startup messages:
  - `🚀 Homie WhatsApp Bot is running!`
  - `📍 Server: http://localhost:PORT`
  - `🔗 Webhook: http://localhost:PORT/webhook`
- [ ] Health endpoint responds (GET http://localhost:PORT/health)
- [ ] Root endpoint responds (GET http://localhost:PORT/)

### Webhook Verification
- [ ] Meta successfully verifies webhook on first setup
- [ ] Console shows: `✅ Webhook verified by Meta`
- [ ] No 403 Forbidden errors in logs
- [ ] No signature validation errors in logs

## End-to-End Testing

### Test 1: Onboarding Flow (Happy Path)

1. Open WhatsApp (mobile, desktop, or web)
2. Add bot's phone number to contacts
3. Send message: `hi`

**Expected:**
- [ ] Console logs: `📩 Incoming message From: [phone]`
- [ ] Bot responds with Question 1 (interests)
- [ ] Message contains emoji and numbered options
- [ ] Response received within 5 seconds

**Response should contain:**
- [ ] Welcome message
- [ ] Activity options (1️⃣ Surfing & water sports, etc.)
- [ ] Instructions to choose multiple or describe in own words

### Test 2: Complete Onboarding

Send these messages in sequence:

1. Message: `1` (surfing interest)
   - [ ] Bot responds with Question 2 (dates)

2. Message: `April 15-20` (dates)
   - [ ] Bot responds with Question 3 (group size)

3. Message: `2 people` (group size)
   - [ ] Bot responds with Question 4 (skill level)

4. Message: `beginner` (skill level)
   - [ ] Bot responds with Question 5 (budget)

5. Message: `mid-range` (budget)
   - [ ] Bot responds with activity recommendations
   - [ ] Response includes at least 1 activity with:
     - [ ] Activity name and location
     - [ ] Category emoji (🏄, 🧘, etc.)
     - [ ] Description snippet
     - [ ] Price range
     - [ ] Phone number
     - [ ] Website (if available)
     - [ ] Instructions for more details (#1, #2, etc.)

### Test 3: Active Conversation Features

After completing onboarding:

1. Message: `more`
   - [ ] Bot responds with different activities
   - [ ] Response differs from previous recommendations

2. Message: `restart` or `start over`
   - [ ] Bot goes back to Question 1
   - [ ] First message shows onboarding questions

3. Message: `#1` or `tell me more about #1`
   - [ ] Bot acknowledges (feature coming soon response OK for MVP)

4. Message: `show me yoga classes`
   - [ ] Bot either:
     - [ ] Returns yoga-related activities, OR
     - [ ] Shows generic fallback (acceptable for MVP)

### Test 4: Error Handling

1. Message: (empty message or special characters)
   - [ ] Bot handles gracefully
   - [ ] No server crash
   - [ ] Logs show error (if any)

2. Disconnect bot mid-conversation and reconnect
   - [ ] User can still receive old conversation state
   - [ ] Bot remembers onboarding progress

## Performance Checks

- [ ] Response time to user < 5 seconds
- [ ] No memory leaks (check server after 100+ messages)
- [ ] Logs show clean message flow without errors
- [ ] CPU usage is reasonable (< 50% on single core)

## Logging Verification

Check console logs for correct output:

- [ ] Incoming messages logged with format: `📩 Incoming message From: [phone] Name: [name] Message: [text]`
- [ ] Outgoing messages logged: `📤 Sent WhatsApp message to [phone]`
- [ ] No unhandled rejections or warnings
- [ ] Signature validation logs (if enabled):
  - [ ] Valid signatures: no error
  - [ ] Invalid signatures: `Invalid Meta webhook signature` error

## Production Readiness Checks

- [ ] All sensitive data is in `.env` (not in code)
- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` has placeholder values (not real credentials)
- [ ] No console.log statements with sensitive data
- [ ] Error responses don't leak internal details
- [ ] All dependencies have versions pinned (package.json)
- [ ] TypeScript strict mode passing (tsc with no errors)

## Rollback Plan

If issues occur:

1. **Bot not responding**
   - [ ] Check server is running: `curl http://localhost:3000/health`
   - [ ] Check webhook URL in Meta dashboard matches server URL
   - [ ] Check credentials in `.env` are correct
   - [ ] Restart server and clear browser cache

2. **Messages sent to wrong number**
   - [ ] Check `WHATSAPP_PHONE_NUMBER_ID` is correct
   - [ ] Verify `WHATSAPP_ACCESS_TOKEN` hasn't expired
   - [ ] Test with fresh token from Meta Business Manager

3. **Signature validation fails**
   - [ ] Set `WHATSAPP_APP_SECRET` to test value temporarily
   - [ ] Or disable validation in development (already does if env var missing)
   - [ ] Regenerate app secret in Meta dashboard if needed

4. **Complete failure**
   - [ ] Revert to previous deployment
   - [ ] Check git history for recent changes
   - [ ] Verify all `.env` variables are present
   - [ ] Run `npm run build` to catch TypeScript errors

## Sign-Off

- [ ] All checks above completed
- [ ] Bot tested with at least 5 unique phone numbers
- [ ] All features working as expected
- [ ] Ready for production deployment

**Tested by:** _______________
**Date:** _______________
**Notes:** _______________________________________________
