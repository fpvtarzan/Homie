import { UserProfile, ConversationState, OnboardingProgress, UserPreferences } from '../types/user';
import { ActivityMatcher } from './matcher';
import { MemoryService } from './memory';
import { AIAgent } from './ai-agent';

export class ConversationalAgent {
  private memory: MemoryService;
  private matcher: ActivityMatcher;
  private ai: AIAgent;

  constructor() {
    this.memory = new MemoryService();
    this.matcher = new ActivityMatcher();
    try {
      this.ai = new AIAgent();
    } catch (error: any) {
      console.error('❌ AIAgent failed to construct:', error?.message);
      this.ai = new AIAgent(); // retry once, or it'll be unavailable
    }
    console.log(`🤖 ConversationalAgent ready. AI available: ${this.ai?.isAvailable}`);
  }

  /**
   * Main entry point for processing incoming messages
   */
  async processMessage(phoneNumber: string, message: string): Promise<string> {
    try {
      // Load or create user profile
      let user = await this.memory.getUserProfile(phoneNumber);

      if (!user) {
        user = await this.createNewUser(phoneNumber);
      }

      // Store message in conversation history
      await this.memory.addMessageToHistory(phoneNumber, message, 'user');

      // If AI agent is available, use it for everything
      if (this.ai.isAvailable) {
        return await this.handleWithAI(user, message);
      }

      // Fallback to rule-based flow
      switch (user.conversationState) {
        case 'new':
        case 'onboarding':
          return await this.handleOnboarding(user, message);
        case 'active':
          return await this.handleActiveConversation(user, message);
        default:
          return this.getOnboardingQuestion(0);
      }
    } catch (error) {
      console.error('Error in conversational agent:', error);
      return 'Sorry, I hit a snag! Type "hi" to start fresh.';
    }
  }

  /**
   * Handle all conversation through the AI agent
   */
  private async handleWithAI(user: UserProfile, message: string): Promise<string> {
    try {
      // Build conversation history for context + include summary for long-term memory
      const history = user.conversationHistory
        .slice(-10)
        .map(msg => ({ role: msg.sender, message: msg.message }));

      // Prepend summary as context if it exists
      if (user.conversationSummary) {
        history.unshift({
          role: 'bot',
          message: `[Background: ${user.conversationSummary}]`
        });
      }

      const { response, extractedPreferences } = await this.ai.chat(
        message,
        user.preferences,
        history
      );

      // Merge any extracted preferences into user profile
      if (extractedPreferences) {
        this.mergePreferences(user, extractedPreferences);
      }

      // Mark user as active once they have some preferences
      if (user.conversationState === 'new' || user.conversationState === 'onboarding') {
        if (user.preferences.interests?.length > 0) {
          user.conversationState = 'active';
        } else {
          user.conversationState = 'onboarding';
        }
      }

      user.lastActiveAt = new Date().toISOString();
      await this.memory.saveUserProfile(user);

      // Store bot response in history
      await this.memory.addMessageToHistory(user.phoneNumber, response, 'bot');

      return response;
    } catch (error: any) {
      console.error('AI agent error, falling back:', error?.message);
      // Fallback to rule-based if AI fails
      return await this.handleFallback(user, message);
    }
  }

  /**
   * Merge extracted preferences into user profile (additive, never overwrite with empty)
   */
  private mergePreferences(user: UserProfile, extracted: Partial<UserPreferences>): void {
    if (extracted.interests?.length) {
      const existing = new Set(user.preferences.interests || []);
      extracted.interests.forEach(i => existing.add(i));
      user.preferences.interests = Array.from(existing);
    }
    if (extracted.budget) user.preferences.budget = extracted.budget;
    if (extracted.groupSize) user.preferences.groupSize = extracted.groupSize;
    if (extracted.skillLevel) user.preferences.skillLevel = extracted.skillLevel;
    if (extracted.dates) user.preferences.dates = extracted.dates;
  }

  /**
   * Fallback handler when AI is unavailable
   */
  private async handleFallback(user: UserProfile, message: string): Promise<string> {
    if (user.conversationState === 'new' || user.conversationState === 'onboarding') {
      return await this.handleOnboarding(user, message);
    }
    return await this.handleActiveConversation(user, message);
  }

  /**
   * Create a new user profile
   */
  private async createNewUser(phoneNumber: string): Promise<UserProfile> {
    const user: UserProfile = {
      userId: this.hashPhoneNumber(phoneNumber),
      phoneNumber,
      conversationState: 'new',
      preferences: {
        interests: []
      },
      location: {
        current: 'Algarve',
        history: []
      },
      conversationHistory: [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    await this.memory.saveUserProfile(user);
    return user;
  }

  /**
   * Handle onboarding flow (5 questions) — FALLBACK only
   */
  private async handleOnboarding(user: UserProfile, message: string): Promise<string> {
    const progress = await this.memory.getOnboardingProgress(user.userId);
    const currentStep = progress?.currentStep || 0;

    const updatedPreferences = this.parseOnboardingResponse(currentStep, message, user.preferences);
    user.preferences = updatedPreferences;

    const nextStep = currentStep + 1;

    if (nextStep >= 5) {
      user.conversationState = 'active';
      await this.memory.saveUserProfile(user);
      await this.memory.clearOnboardingProgress(user.userId);

      const recommendations = await this.matcher.getRecommendations(user.preferences);
      return this.formatRecommendations(recommendations);
    }

    await this.memory.saveOnboardingProgress(user.userId, nextStep);
    await this.memory.saveUserProfile(user);

    return this.getOnboardingQuestion(nextStep);
  }

  /**
   * Handle conversations after onboarding — FALLBACK only
   */
  private async handleActiveConversation(user: UserProfile, message: string): Promise<string> {
    const lowerMessage = message.toLowerCase().trim();

    if (lowerMessage === 'restart' || lowerMessage === 'start over') {
      user.conversationState = 'onboarding';
      await this.memory.saveUserProfile(user);
      await this.memory.clearOnboardingProgress(user.userId);
      return this.getOnboardingQuestion(0);
    }

    if (lowerMessage.includes('more') || lowerMessage.includes('other') || lowerMessage.includes('different')) {
      const recommendations = await this.matcher.getRecommendations(user.preferences, 5, 5);
      return this.formatRecommendations(recommendations);
    }

    const searchResults = await this.matcher.searchActivities(message, user.preferences);
    if (searchResults.length > 0) {
      return this.formatRecommendations(searchResults);
    }

    return `I'm here to help you discover amazing activities in the Algarve!

You can:
- Ask for more recommendations
- Tell me about specific interests ("show me yoga classes")
- Type "restart" to update your preferences

What would you like to know?`;
  }

  // ===== Fallback parsing methods (kept for when AI is unavailable) =====

  private getOnboardingQuestion(step: number): string {
    const questions = [
      `Welcome to Algarve Adventures! 👋

I'll help you discover amazing activities in the Algarve region.

Let's start! What brings you to the Algarve?

1️⃣ Surfing & water sports
2️⃣ Wellness & yoga retreats
3️⃣ Golf & outdoor sports
4️⃣ Cultural experiences
5️⃣ Food & wine tours
6️⃣ Diving & marine exploration
7️⃣ Not sure - surprise me!

(You can choose multiple or describe in your own words)`,

      `Great choice! 🗓️

When are you visiting?

For example:
- "April 10-17"
- "May 2025"
- "Next week"
- "This summer"`,

      `Perfect! 👥

How many people are in your group?

For example:
- "Solo"
- "2 adults"
- "Family of 4"
- "Group of 8"`,

      `Awesome! 🏄

What's your experience level?

1️⃣ Never tried - complete beginner
2️⃣ Beginner - tried once or twice
3️⃣ Intermediate - comfortable with basics
4️⃣ Advanced - looking to improve technique`,

      `Last question! 💰

What's your budget preference?

💵 Budget-friendly (€-€€)
💰 Mid-range (€€)
💎 Premium experience (€€€)

Reply with: budget, mid-range, or premium`
    ];

    return questions[step] || questions[0];
  }

  private parseOnboardingResponse(step: number, message: string, currentPreferences: UserPreferences): UserPreferences {
    const lowerMessage = message.toLowerCase().trim();

    switch (step) {
      case 0: return { ...currentPreferences, interests: this.parseInterests(lowerMessage) };
      case 1: return { ...currentPreferences, dates: this.parseDates(lowerMessage) };
      case 2: return { ...currentPreferences, groupSize: this.parseGroupSize(lowerMessage) };
      case 3: return { ...currentPreferences, skillLevel: this.parseSkillLevel(lowerMessage) };
      case 4: return { ...currentPreferences, budget: this.parseBudget(lowerMessage) };
      default: return currentPreferences;
    }
  }

  private parseInterests(message: string): string[] {
    const interests: string[] = [];
    const keywords: Record<string, string[]> = {
      surfing: ['surf', '1', 'water sport'],
      yoga: ['yoga', '2', 'wellness', 'meditation'],
      golf: ['golf', '3', 'outdoor'],
      cultural: ['cultur', '4', 'history', 'heritage', 'pottery', 'art'],
      gastronomy: ['food', '5', 'wine', 'cooking', 'gastronomy', 'culinary'],
      diving: ['div', '6', 'marine', 'underwater', 'scuba'],
      hiking: ['hik', 'walk', 'trail', 'nature'],
      kayaking: ['kayak', 'paddle', 'boat']
    };

    for (const [interest, terms] of Object.entries(keywords)) {
      if (terms.some(term => message.includes(term))) {
        interests.push(interest);
      }
    }

    if (message.includes('not sure') || message.includes('surprise') || message.includes('7')) {
      return ['surfing', 'yoga', 'cultural', 'gastronomy'];
    }

    return interests.length > 0 ? interests : ['general'];
  }

  private parseDates(message: string): { arrival: string; departure: string } | undefined {
    const now = new Date();
    if (message.includes('today') || message.includes('now')) {
      return {
        arrival: now.toISOString(),
        departure: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
    }
    return { arrival: message, departure: message };
  }

  private parseGroupSize(message: string): number {
    const numberMatch = message.match(/(\d+)/);
    if (numberMatch) return parseInt(numberMatch[1]);
    if (message.includes('solo') || message.includes('alone') || message.includes('myself')) return 1;
    if (message.includes('couple') || message.includes('two') || message.includes('2')) return 2;
    return 2;
  }

  private parseSkillLevel(message: string): 'beginner' | 'intermediate' | 'advanced' {
    if (message.includes('never') || message.includes('first') || message.includes('1')) return 'beginner';
    if (message.includes('advanced') || message.includes('expert') || message.includes('4')) return 'advanced';
    if (message.includes('intermediate') || message.includes('3')) return 'intermediate';
    return 'beginner';
  }

  private parseBudget(message: string): '€' | '€€' | '€€€' {
    if (message.includes('budget') || message.includes('cheap') || message.includes('€')) return '€';
    if (message.includes('premium') || message.includes('luxury') || message.includes('€€€')) return '€€€';
    return '€€';
  }

  private formatRecommendations(activities: any[]): string {
    if (activities.length === 0) {
      return `I couldn't find activities matching your criteria. Try asking for specific activities like:
- "Show me surfing schools"
- "Find yoga classes"
- "What about cultural activities?"`;
    }

    let response = `Here are my top ${Math.min(activities.length, 5)} recommendations:\n\n`;

    activities.slice(0, 5).forEach((activity, index) => {
      const emoji = this.getCategoryEmoji(activity.category);
      response += `${index + 1}. ${activity.name} (${activity.location})\n`;
      response += `   ${emoji} ${activity.description.slice(0, 100)}...\n`;
      response += `   📍 ${activity.location} | 💰 ${activity.priceRange}\n`;
      response += `   📞 ${activity.phone}\n\n`;
    });

    response += `Want details on any of these? Or ask for "more options"!`;
    return response;
  }

  private getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
      surfing: '🏄', yoga: '🧘', diving: '🤿', kayaking: '🚣',
      cultural: '🎨', gastronomy: '🍷', golf: '⛳', equestrian: '🐴',
      watersports: '🏄', 'boat-tours': '⛵', wellness: '💆', hiking: '🥾'
    };
    return emojis[category] || '✨';
  }

  private hashPhoneNumber(phoneNumber: string): string {
    return `user_${phoneNumber.replace(/\D/g, '')}`;
  }
}
