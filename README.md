# Homie - WhatsApp Travel Guide Bot

A conversational AI travel guide for discovering activities in the Algarve region via WhatsApp.

## Overview

Homie helps travelers find personalized activity recommendations through a simple WhatsApp conversation. Users answer 5 quick questions about their preferences, and the bot recommends the best activities from 100+ curated options including surfing, yoga, diving, cultural experiences, and more.

## Features

- **WhatsApp Integration**: Text-based interface via Twilio
- **Semantic Search**: HNSW-powered activity matching via AgentDB
- **Personalized Recommendations**: Matches activities to user preferences
- **Location Tracking**: Track where users continue using the app for expansion planning
- **Multi-category Support**: Surfing, yoga, diving, cultural, gastronomy, golf, and more

## Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **WhatsApp**: Twilio WhatsApp API
- **Memory/Search**: AgentDB with HNSW indexing (claude-flow)
- **Deployment**: Railway.app
- **AI**: Claude (Anthropic) for conversation coordination

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Twilio account with WhatsApp enabled
- Railway account (for deployment)
- Claude API key (Anthropic)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Homie
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Initialize AgentDB:
```bash
npx @claude-flow/cli@latest memory init
```

5. Load activities into AgentDB:
```bash
# Run the data loader script (to be implemented)
npm run load-activities
```

### Development

Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`.

### Build

Compile TypeScript to JavaScript:
```bash
npm run build
```

### Deployment

Deploy to Railway:
```bash
railway login
railway init
railway up
```

Configure environment variables in Railway dashboard, then update your Twilio webhook URL.

## Project Structure

```
Homie/
├── src/
│   ├── index.ts                 # Express server entry point
│   ├── routes/
│   │   └── webhook.ts           # Twilio webhook handler
│   ├── agents/
│   │   ├── conversational.ts    # Conversation coordinator
│   │   ├── matcher.ts           # Activity matching logic
│   │   └── memory.ts            # AgentDB wrapper
│   ├── utils/
│   │   └── twilio.ts            # Twilio API helper
│   └── types/
│       ├── activity.ts          # Activity interface
│       └── user.ts              # UserProfile interface
├── data/
│   ├── activities.json          # Activity database
│   └── users/                   # User profiles (gitignored)
├── tests/                       # Test files
├── .env.example                 # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

### User Flow

1. User texts the Twilio WhatsApp number
2. Bot greets and asks 5 onboarding questions:
   - What interests you? (surfing, yoga, culture, etc.)
   - When are you visiting?
   - How many people?
   - Experience level?
   - Budget preference?
3. Bot recommends top 5 matching activities
4. User can ask follow-up questions or get more details
5. Bot tracks location for expansion analytics

### Example Conversation

```
User: Hi
Bot: Welcome to Algarve Adventures! What brings you to the Algarve?
User: Surfing and yoga
Bot: Great! When are you visiting?
User: April 10-17
Bot: Perfect! How many people?
User: 2 adults
Bot: Surfing experience level?
User: Beginner
Bot: Budget preference?
User: Mid-range
Bot: Here are my top 3 recommendations:
     1️⃣ Soul & Surf Portugal (Luz)...
     [recommendations with contact details]
```

## Configuration

### Environment Variables

See `.env.example` for required variables:
- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `TWILIO_PHONE_NUMBER`: Your Twilio WhatsApp number
- `ANTHROPIC_API_KEY`: Your Claude API key

### Twilio Webhook Setup

1. Get your Railway deployment URL
2. Configure in Twilio Console:
   - Webhook URL: `https://your-app.railway.app/webhook`
   - Method: POST
   - Fallback URL: Same as above

## Development Roadmap

### Phase 1 (MVP - Weeks 1-2) ✅
- [x] Extract PDF data to JSON
- [x] Initialize Node.js project
- [ ] Build Express webhook server
- [ ] Implement conversation agent
- [ ] Build activity matcher
- [ ] Configure AgentDB
- [ ] Integrate Twilio
- [ ] Deploy to Railway
- [ ] Beta testing with 10 users

### Phase 2 (Weeks 3-4)
- [ ] User reviews and ratings
- [ ] Photo sharing
- [ ] Daily activity suggestions
- [ ] WhatsApp broadcast lists

### Phase 3 (Month 2)
- [ ] Booking integration
- [ ] Commission tracking
- [ ] Premium features
- [ ] Partner dashboard

### Phase 4 (Month 3+)
- [ ] GPS location tracking
- [ ] Expansion to Lisbon/Porto
- [ ] Multi-language support
- [ ] Analytics dashboard

## Contributing

This is a private project. For questions or support, contact the development team.

## License

ISC
