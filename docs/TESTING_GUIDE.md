# Testing Guide for Homie WhatsApp Bot

Comprehensive testing guide for validating your WhatsApp travel guide bot.

---

## Testing Checklist

### ✅ Pre-Testing Setup

- [ ] Twilio account created
- [ ] WhatsApp sandbox joined
- [ ] `.env` file configured with Twilio credentials
- [ ] Server running (`npm run dev`)
- [ ] ngrok tunnel active (or Railway deployed)
- [ ] Twilio webhook configured

---

## Test 1: Basic Connectivity

**Purpose:** Verify server is accessible and webhook is working

### Steps:

1. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

   **Expected:**
   ```json
   {
     "status": "ok",
     "timestamp": "2026-03-06T...",
     "environment": "development"
   }
   ```

2. **Test webhook endpoint:**
   ```bash
   curl http://localhost:3000/webhook
   ```

   **Expected:**
   ```json
   {
     "message": "Webhook endpoint is active",
     "method": "POST required for Twilio webhooks"
   }
   ```

✅ **Pass Criteria:** Both endpoints return 200 OK

---

## Test 2: WhatsApp Message Delivery

**Purpose:** Verify Twilio can reach your server

### Steps:

1. Open WhatsApp on your phone
2. Go to Twilio sandbox conversation
3. Send: `test`
4. Check server logs

**Expected Server Logs:**
```
📩 Incoming message
From: whatsapp:+1234567890
Name: Your Name
Message: test
```

✅ **Pass Criteria:** Server receives message and logs it

---

## Test 3: Complete Onboarding Flow

**Purpose:** Test full user journey from first message to recommendations

### Test Script:

| Step | You Send | Bot Should Respond |
|------|----------|-------------------|
| 1 | `Hi` | Welcome message + Question 1 (interests) |
| 2 | `Surfing and yoga` | Question 2 (dates) |
| 3 | `April 10-17` | Question 3 (group size) |
| 4 | `2 adults` | Question 4 (experience level) |
| 5 | `Beginner` | Question 5 (budget) |
| 6 | `Mid-range` | Top 5 activity recommendations |

### Validation Points:

- [ ] Each question appears in sequence
- [ ] Bot remembers previous answers
- [ ] Final recommendations match preferences:
  - Include surfing AND yoga activities
  - Show mid-range (€€) pricing
  - Suitable for beginners
  - Good for couples/small groups

✅ **Pass Criteria:** All 5 questions completed, relevant recommendations shown

---

## Test 4: User Preference Matching

**Purpose:** Verify activity matcher scores correctly

### Test Cases:

#### Test Case A: Budget Conscious Surfer
```
Interests: Surfing
Budget: Budget-friendly
Skill: Beginner
Group: Solo
```

**Expected:** Activities like "Algarve Surf School" (€€, beginner-friendly)

#### Test Case B: Luxury Wellness Retreat
```
Interests: Yoga, wellness
Budget: Premium
Skill: Intermediate
Group: 2 adults
```

**Expected:** "Soul & Surf Portugal" (€€€, yoga-surf integration)

#### Test Case C: Cultural Explorer
```
Interests: Cultural, food
Budget: Mid-range
Skill: Beginner
Group: Family of 4
```

**Expected:** "Porches Pottery", "Portugal Farm Experience"

✅ **Pass Criteria:** Recommendations align with stated preferences

---

## Test 5: Follow-Up Queries

**Purpose:** Test active conversation state after onboarding

### Test Script:

| You Send | Bot Should Respond |
|----------|-------------------|
| `Tell me more about #1` | Detailed info about first activity |
| `Show me more options` | Next 5 recommendations |
| `What about yoga classes?` | Yoga-specific activities |
| `Restart` | Start onboarding over |

✅ **Pass Criteria:** Bot handles all follow-up intents correctly

---

## Test 6: User Data Persistence

**Purpose:** Verify user profiles are saved and loaded

### Steps:

1. Complete onboarding as "User A"
2. Send: `more options`
3. Close WhatsApp
4. **Wait 5 minutes**
5. Send: `hi`

**Expected:**
- Bot remembers you completed onboarding
- Doesn't ask questions again
- Continues active conversation

✅ **Pass Criteria:** User state persists between sessions

**Verify Files:**
```bash
ls data/users/
# Should show: user_*.json files
```

---

## Test 7: Error Handling

**Purpose:** Verify graceful handling of edge cases

### Test Cases:

#### A. Empty/Unclear Messages
```
You: asdf
Bot: [Should provide helpful fallback message]
```

#### B. Out-of-Context Questions
```
You: What's the weather?
Bot: [Should redirect to activity recommendations]
```

#### C. Very Long Message
```
You: [Send 500+ character message]
Bot: [Should still respond, truncate gracefully]
```

✅ **Pass Criteria:** No crashes, helpful fallback responses

---

## Test 8: Multiple Users Concurrently

**Purpose:** Verify server handles multiple conversations

### Steps:

1. **User A** (your phone): Start onboarding
2. **User B** (friend's phone): Start onboarding
3. Send messages alternating between both
4. Verify conversations don't mix

✅ **Pass Criteria:** Each user has independent conversation state

---

## Test 9: Activity Data Validation

**Purpose:** Ensure activities display correctly

### Verify:

- [ ] Activity names display correctly
- [ ] Contact info (phone, website) present
- [ ] Price ranges shown (€, €€, €€€)
- [ ] Categories correct (surfing, yoga, etc.)
- [ ] Emojis render properly
- [ ] No broken links or missing data

✅ **Pass Criteria:** All 30 activities have complete, correct data

---

## Test 10: Performance & Reliability

**Purpose:** Verify system stability

### Metrics:

| Metric | Target | Actual |
|--------|--------|--------|
| Response time | <2 seconds | _____ |
| Server uptime | 100% during test | _____ |
| Error rate | 0% | _____ |
| Messages delivered | 100% | _____ |

### Stress Test:

1. Send 20 rapid messages in 60 seconds
2. Check server doesn't crash
3. Verify all messages get responses

✅ **Pass Criteria:** All metrics within targets

---

## Test 11: Location Tracking

**Purpose:** Verify expansion analytics work

### Steps:

1. Complete onboarding
2. Bot asks: "Where are you now?"
3. You reply: "Lisbon"
4. Check user profile file

**Verify in `data/users/user_*.json`:**
```json
{
  "location": {
    "current": "Lisbon",
    "history": [
      {
        "location": "Algarve",
        "timestamp": "...",
        "source": "manual"
      },
      {
        "location": "Lisbon",
        "timestamp": "...",
        "source": "manual"
      }
    ]
  }
}
```

✅ **Pass Criteria:** Location history tracked correctly

---

## Test 12: Conversation History

**Purpose:** Verify messages are logged

### Steps:

1. Have a 10-message conversation
2. Check user profile file
3. Verify `conversationHistory` array

**Expected:**
```json
{
  "conversationHistory": [
    {
      "timestamp": "2026-03-06T12:00:00Z",
      "message": "Hi",
      "sender": "user"
    },
    {
      "timestamp": "2026-03-06T12:00:01Z",
      "message": "Welcome to Algarve Adventures!...",
      "sender": "bot"
    }
  ]
}
```

✅ **Pass Criteria:** All messages logged with timestamps

---

## Regression Testing

After any code changes, re-run:

- [ ] Test 3: Complete onboarding flow
- [ ] Test 5: Follow-up queries
- [ ] Test 7: Error handling

---

## Bug Reporting Template

When you find a bug, document it:

```markdown
**Bug Title:** [Short description]

**Steps to Reproduce:**
1. ...
2. ...

**Expected Behavior:**
...

**Actual Behavior:**
...

**Server Logs:**
```
[Paste relevant logs]
```

**Environment:**
- OS: macOS/Windows/Linux
- Node version: ...
- Branch: main
```

---

## Success Criteria for Production Launch

Before inviting 10 beta users:

- [ ] All 12 tests passing
- [ ] 0 known critical bugs
- [ ] Server stable for 24 hours continuous
- [ ] 3-5 internal testers completed full flow
- [ ] Data backup process in place
- [ ] Monitoring/alerts configured

---

## Monitoring During Beta

Track these metrics:

| Metric | Target | How to Check |
|--------|--------|--------------|
| Onboarding completion rate | >70% | Count user files with `conversationState: "active"` |
| Follow-up questions | >50% | Check `conversationHistory` length >7 |
| Average recommendations per user | 3+ | Count recommendation messages |
| User retention (7-day) | >40% | Track `lastActiveAt` timestamps |

---

## Next Steps After Testing

1. ✅ All tests passing → Ready for Task #9 (Deploy to Railway)
2. 🔍 Found bugs → Fix and re-test
3. 💡 Feature ideas → Document for Phase 2

---

**Happy Testing!** 🧪
