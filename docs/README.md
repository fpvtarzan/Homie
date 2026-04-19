# Homie WhatsApp Bot - Documentation

Complete documentation for building, deploying, and maintaining your WhatsApp travel guide bot.

---

## 📚 Documentation Index

### Getting Started

1. **[Quick Start Guide](QUICK_START.md)** ⚡
   - Get running in 10 minutes
   - Local testing with ngrok
   - Perfect for first-time setup

2. **[Twilio Setup](TWILIO_SETUP.md)** 📱
   - Detailed Twilio integration
   - WhatsApp sandbox configuration
   - Production number application
   - Troubleshooting

3. **[Testing Guide](TESTING_GUIDE.md)** 🧪
   - 12 comprehensive test cases
   - Validation checklist
   - Performance benchmarks
   - Bug reporting

### Deployment (Coming Soon)

4. **Railway Deployment** 🚂
   - One-command production deployment
   - Environment configuration
   - Domain setup
   - Monitoring

5. **Production Checklist** ✅
   - Pre-launch validation
   - Security hardening
   - Performance optimization
   - Backup strategy

---

## 🏗️ Project Structure

```
Homie/
├── src/
│   ├── index.ts                 # Express server
│   ├── routes/
│   │   └── webhook.ts           # Twilio webhook handler
│   ├── agents/
│   │   ├── conversational.ts    # Main conversation logic
│   │   ├── matcher.ts           # Activity matching
│   │   └── memory.ts            # User data storage
│   ├── utils/
│   │   └── twilio.ts            # Twilio helper
│   └── types/
│       ├── activity.ts          # Activity types
│       └── user.ts              # User types
├── data/
│   ├── activities.json          # 30 curated activities
│   └── users/                   # User profiles (generated)
├── docs/                        # You are here!
└── tests/                       # Test files (coming soon)
```

---

## 🎯 Feature Status

### ✅ Completed (Week 1)

- [x] Data extraction (30 activities)
- [x] Node.js + TypeScript setup
- [x] Express webhook server
- [x] Conversational agent (5-question onboarding)
- [x] Activity matching algorithm
- [x] User profile storage
- [x] Twilio WhatsApp integration

### 🚧 In Progress (Week 2)

- [ ] Railway deployment
- [ ] Internal testing (3-5 users)
- [ ] Beta launch (10 users)

### 📅 Future (Phase 2+)

- [ ] AgentDB semantic search
- [ ] User reviews and ratings
- [ ] Photo sharing
- [ ] Booking integration
- [ ] Admin dashboard
- [ ] Multi-language support

---

## 🚀 Quick Commands

```bash
# Development
npm run dev          # Start dev server with hot reload

# Build
npm run build        # Compile TypeScript to JavaScript

# Production
npm start            # Run compiled code

# Testing (coming soon)
npm test            # Run test suite
```

---

## 📊 Architecture Overview

### Message Flow

```
User's WhatsApp
    ↓
Twilio WhatsApp API
    ↓
Your Server (Express + webhook)
    ↓
Conversational Agent
    ├→ New user? Start onboarding
    ├→ Onboarding? Continue questions
    └→ Active? Process query
           ↓
    Activity Matcher
    ├→ Load activities from JSON
    ├→ Score by preferences
    └→ Return top 5 matches
           ↓
    Format response
           ↓
Twilio WhatsApp API
    ↓
User's WhatsApp
```

### Data Storage (MVP)

```
data/
├── activities.json              # Static activity database
└── users/
    ├── user_1234567890.json    # User profile
    ├── user_0987654321.json    # User profile
    └── ...
```

**Future:** Migrate to Supabase for scalability.

---

## 🔑 Key Technologies

| Technology | Purpose | Why? |
|------------|---------|------|
| **Node.js + TypeScript** | Backend runtime | Type safety, modern JS |
| **Express** | Web framework | Simple, mature, fast |
| **Twilio** | WhatsApp API | Easiest WhatsApp integration |
| **AgentDB (future)** | Semantic search | 150x faster than linear search |
| **Railway** | Deployment | Zero-config HTTPS, auto-deploy |

---

## 💡 Design Decisions

### Why JSON files instead of database?

**For MVP (10-100 users):**
- ✅ No external dependencies
- ✅ Easy to inspect and debug
- ✅ Version control friendly
- ✅ Zero operational overhead

**When to migrate:** 100+ users or need for complex queries.

### Why Twilio instead of direct WhatsApp API?

**Twilio advantages:**
- ✅ 1-week setup vs. 2-4 weeks for Meta
- ✅ Mature SDK and documentation
- ✅ Sandbox for instant testing
- ✅ Better error handling

**Cost:** Minimal difference ($0.005/message).

### Why simple scoring vs. ML?

**For MVP:**
- ✅ Works well for 30 activities
- ✅ Explainable recommendations
- ✅ No training data needed
- ✅ Fast (<1ms matching)

**When to upgrade:** 500+ activities or complex user patterns.

---

## 📈 Success Metrics (Beta)

Track these during beta testing:

| Metric | Target | Purpose |
|--------|--------|---------|
| **Onboarding completion** | >70% | User experience quality |
| **Follow-up questions** | >50% | Engagement level |
| **Avg recommendations per user** | 3+ | Value delivery |
| **7-day retention** | >40% | Product-market fit |

---

## 🛡️ Security Considerations

### Implemented:

- ✅ Environment variables for secrets
- ✅ Twilio signature validation
- ✅ HTTPS required (Railway/ngrok)
- ✅ `.env` in `.gitignore`
- ✅ Phone number hashing

### Future:

- [ ] Rate limiting
- [ ] User authentication (optional)
- [ ] PII encryption at rest
- [ ] GDPR compliance tools

---

## 🐛 Known Issues

*None yet!* 🎉

Report issues by creating a file in `docs/bugs/` with:
- Steps to reproduce
- Expected vs actual behavior
- Server logs

---

## 📞 Support

### Documentation Issues
- Check relevant guide first
- Search for similar issues
- Create detailed bug report

### Development Questions
- Review architecture diagram
- Check code comments
- Test with `npm run dev`

---

## 📖 Additional Resources

### External Links

- **Twilio WhatsApp Docs**: https://www.twilio.com/docs/whatsapp
- **Express.js Docs**: https://expressjs.com
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Railway Docs**: https://docs.railway.app

### Internal References

- **Main README**: `../README.md` - Project overview
- **Plan File**: `../.claude/plans/misty-painting-scroll.md` - Implementation plan
- **Package.json**: `../package.json` - Dependencies

---

## 🎓 Learning Path

**New to the project?** Follow this sequence:

1. Read `../README.md` (project overview)
2. Follow `QUICK_START.md` (get it running)
3. Read `TWILIO_SETUP.md` (understand integration)
4. Run tests from `TESTING_GUIDE.md` (validate setup)
5. Review architecture in this file
6. Explore source code in `../src/`

---

## 📝 Changelog

### 2026-03-06 - v1.0.0 (MVP)

**Added:**
- Complete WhatsApp bot implementation
- 30 curated Algarve activities
- 5-question onboarding flow
- Smart activity matching
- User profile storage
- Twilio integration
- Comprehensive documentation

---

**Documentation maintained with ❤️ by the Homie team**
