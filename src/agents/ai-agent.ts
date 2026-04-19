import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { Activity } from '../types/activity';
import { UserPreferences } from '../types/user';

/**
 * AI Agent powered by Claude Haiku for natural conversation.
 * Replaces the hardcoded 5-question onboarding with free-flowing chat
 * that profiles the user and recommends Algarve activities.
 */
export class AIAgent {
  private client: Anthropic | null = null;
  private activities: Activity[] = [];
  private activitiesLoaded = false;

  constructor() {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      console.log(`🔑 ANTHROPIC_API_KEY: ${apiKey ? 'set (length=' + apiKey.length + ')' : 'NOT SET'}`);
      if (apiKey && apiKey.length > 10 && apiKey !== 'your_claude_api_key_here') {
        this.client = new Anthropic({ apiKey });
        console.log('🤖 AI Agent initialized with Claude Haiku');
      } else {
        console.warn('⚠️ ANTHROPIC_API_KEY not set or invalid — AI agent disabled, using fallback');
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize AI Agent:', error?.message);
      this.client = null;
    }
    this.loadActivities();
  }

  get isAvailable(): boolean {
    return this.client !== null;
  }

  private async loadActivities(): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'data', 'activities.json');
      const data = await fs.readFile(filePath, 'utf-8');
      this.activities = JSON.parse(data);
      this.activitiesLoaded = true;
    } catch (error) {
      console.error('AI Agent: Error loading activities:', error);
    }
  }

  private async ensureActivities(): Promise<void> {
    if (!this.activitiesLoaded) await this.loadActivities();
  }

  /**
   * Build the system prompt with activity catalog and user context
   */
  private buildSystemPrompt(preferences: UserPreferences, conversationHistory: { role: string; message: string }[]): string {
    const activitiesSummary = this.activities.map(a =>
      `- ${a.name} (${a.category}, ${a.location}) | ${a.priceRange} | ${a.skillLevel.join('/')} | ${a.description.slice(0, 120)}`
    ).join('\n');

    const knownPrefs: string[] = [];
    if (preferences.interests?.length > 0) knownPrefs.push(`Interests: ${preferences.interests.join(', ')}`);
    if (preferences.budget) knownPrefs.push(`Budget: ${preferences.budget}`);
    if (preferences.groupSize) knownPrefs.push(`Group size: ${preferences.groupSize}`);
    if (preferences.skillLevel) knownPrefs.push(`Skill level: ${preferences.skillLevel}`);
    if (preferences.dates) knownPrefs.push(`Dates: ${preferences.dates.arrival}`);

    return `You are Homie, WhatsApp travel concierge for the Algarve.

RULES:
- ULTRA-SHORT: Max 2-3 short lines. Conversational, not robotic.
- NO markdown (no **, ##, -, •), NO emojis, plain text only.
- NO preamble. Direct answers.
- Remember context from conversation history.

${knownPrefs.length > 0 ? `ALREADY KNOW:\n${knownPrefs.join('\n')}\n` : ''}

ACTIVITY CATALOG:
${activitiesSummary}

IF RECOMMENDING: name + location + price + why it fits. One line per activity max.
ONLY from catalog. If not in catalog, suggest closest match.
If they ask "more", show different ones. End with "Want details?"

Goal: Learn interests → recommend. Natural conversation, 2-3 messages max to get enough info.`;
  }

  /**
   * Chat with the AI agent
   */
  async chat(
    userMessage: string,
    preferences: UserPreferences,
    conversationHistory: { role: string; message: string }[]
  ): Promise<{ response: string; extractedPreferences: Partial<UserPreferences> }> {
    await this.ensureActivities();

    if (!this.client) {
      throw new Error('AI Agent not initialized');
    }

    // Build messages array from conversation history (last 10 messages for context window)
    const messages: Anthropic.MessageParam[] = conversationHistory
      .slice(-10)
      .map(msg => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.message
      }));

    // Add current message
    messages.push({ role: 'user', content: userMessage });

    // Ensure messages alternate properly (Claude requires this)
    const cleanedMessages = this.ensureAlternatingRoles(messages);

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: this.buildSystemPrompt(preferences, conversationHistory),
        messages: cleanedMessages
      });

      const aiResponse = response.content[0].type === 'text'
        ? response.content[0].text
        : 'Sorry, I had trouble responding. Try again!';

      // Extract any preferences mentioned in the user's message
      const extracted = this.extractPreferences(userMessage);

      return { response: aiResponse, extractedPreferences: extracted };
    } catch (error: any) {
      console.error('AI Agent error:', error?.message || error);
      throw error;
    }
  }

  /**
   * Ensure messages alternate between user and assistant (Claude API requirement)
   */
  private ensureAlternatingRoles(messages: Anthropic.MessageParam[]): Anthropic.MessageParam[] {
    if (messages.length === 0) return messages;

    const cleaned: Anthropic.MessageParam[] = [];
    for (const msg of messages) {
      if (cleaned.length === 0) {
        // First message must be from user
        if (msg.role === 'user') {
          cleaned.push(msg);
        }
        continue;
      }
      // Skip consecutive same-role messages (keep last one)
      if (cleaned[cleaned.length - 1].role === msg.role) {
        cleaned[cleaned.length - 1] = msg;
      } else {
        cleaned.push(msg);
      }
    }

    // Ensure first message is user
    if (cleaned.length > 0 && cleaned[0].role !== 'user') {
      cleaned.shift();
    }

    // Ensure last message is user
    if (cleaned.length > 0 && cleaned[cleaned.length - 1].role !== 'user') {
      cleaned.pop();
    }

    return cleaned.length > 0 ? cleaned : [{ role: 'user', content: 'hi' }];
  }

  /**
   * Extract preferences from user message (lightweight keyword extraction)
   * This updates the stored profile so the system prompt stays current
   */
  private extractPreferences(message: string): Partial<UserPreferences> {
    const lower = message.toLowerCase();
    const prefs: Partial<UserPreferences> = {};

    // Interests
    const interestMap: Record<string, string> = {
      'surf': 'surfing', 'wave': 'surfing', 'board': 'surfing',
      'yoga': 'yoga', 'meditat': 'yoga', 'wellness': 'yoga', 'pilates': 'wellness',
      'golf': 'golf',
      'div': 'diving', 'scuba': 'diving', 'underwater': 'diving',
      'kayak': 'kayaking', 'paddle': 'kayaking',
      'cultur': 'cultural', 'pottery': 'cultural', 'tile': 'cultural', 'art': 'cultural',
      'food': 'gastronomy', 'wine': 'gastronomy', 'cook': 'gastronomy',
      'horse': 'equestrian', 'rid': 'equestrian',
      'boat': 'boat-tours', 'dolphin': 'boat-tours',
      'hik': 'hiking', 'walk': 'hiking', 'trail': 'hiking',
      'kite': 'watersports', 'windsurf': 'watersports'
    };

    const interests: string[] = [];
    for (const [keyword, interest] of Object.entries(interestMap)) {
      if (lower.includes(keyword) && !interests.includes(interest)) {
        interests.push(interest);
      }
    }
    if (interests.length > 0) prefs.interests = interests;

    // Budget
    if (lower.includes('budget') || lower.includes('cheap') || lower.includes('affordable')) {
      prefs.budget = '€';
    } else if (lower.includes('premium') || lower.includes('luxury') || lower.includes('high-end')) {
      prefs.budget = '€€€';
    } else if (lower.includes('mid') || lower.includes('moderate')) {
      prefs.budget = '€€';
    }

    // Skill level
    if (lower.includes('never') || lower.includes('first time') || lower.includes('beginner') || lower.includes('newbie')) {
      prefs.skillLevel = 'beginner';
    } else if (lower.includes('advanced') || lower.includes('expert') || lower.includes('experienced')) {
      prefs.skillLevel = 'advanced';
    } else if (lower.includes('intermediate') || lower.includes('some experience')) {
      prefs.skillLevel = 'intermediate';
    }

    // Group size
    const groupMatch = lower.match(/(\d+)\s*(people|person|pax|adults|of us)/);
    if (groupMatch) {
      prefs.groupSize = parseInt(groupMatch[1]);
    } else if (lower.includes('solo') || lower.includes('alone') || lower.includes('just me') || lower.includes('by myself')) {
      prefs.groupSize = 1;
    } else if (lower.includes('couple') || lower.includes('girlfriend') || lower.includes('boyfriend') || lower.includes('partner') || lower.includes('two of us')) {
      prefs.groupSize = 2;
    } else if (lower.includes('family')) {
      prefs.groupSize = 4;
    }

    return prefs;
  }
}
