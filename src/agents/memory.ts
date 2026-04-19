import fs from 'fs/promises';
import path from 'path';
import { UserProfile, OnboardingProgress, ConversationMessage } from '../types/user';

/**
 * Memory service for storing and retrieving user data
 * Uses JSON files for MVP - can be upgraded to database later
 */
export class MemoryService {
  private userDataDir: string;

  constructor() {
    this.userDataDir = path.join(process.cwd(), 'data', 'users');
    this.ensureUserDataDir();
  }

  /**
   * Ensure user data directory exists
   */
  private async ensureUserDataDir(): Promise<void> {
    try {
      await fs.access(this.userDataDir);
    } catch {
      await fs.mkdir(this.userDataDir, { recursive: true });
    }
  }

  /**
   * Get user profile by phone number
   */
  async getUserProfile(phoneNumber: string): Promise<UserProfile | null> {
    try {
      const userId = this.hashPhoneNumber(phoneNumber);
      const filePath = path.join(this.userDataDir, `${userId}.json`);

      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // User doesn't exist yet
      return null;
    }
  }

  /**
   * Save user profile
   */
  async saveUserProfile(user: UserProfile): Promise<void> {
    try {
      await this.ensureUserDataDir();

      const filePath = path.join(this.userDataDir, `${user.userId}.json`);
      user.lastActiveAt = new Date().toISOString();

      await fs.writeFile(filePath, JSON.stringify(user, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  /**
   * Add message to conversation history with auto-summarization
   */
  async addMessageToHistory(
    phoneNumber: string,
    message: string,
    sender: 'user' | 'bot'
  ): Promise<void> {
    const user = await this.getUserProfile(phoneNumber);
    if (!user) return;

    const conversationMessage: ConversationMessage = {
      timestamp: new Date().toISOString(),
      message,
      sender
    };

    user.conversationHistory.push(conversationMessage);

    // Auto-summarize old messages: keep last 20, condense older ones
    if (user.conversationHistory.length > 20) {
      const recentMessages = user.conversationHistory.slice(-20);
      const olderMessages = user.conversationHistory.slice(0, -20);

      // Create summary of older messages
      if (olderMessages.length > 0) {
        const summary = this.summarizeMessages(olderMessages);
        user.conversationSummary = summary;
      }

      user.conversationHistory = recentMessages;
    }

    await this.saveUserProfile(user);
  }

  /**
   * Summarize older messages for context persistence
   */
  private summarizeMessages(messages: ConversationMessage[]): string {
    const userMessages = messages.filter(m => m.sender === 'user');
    const interests: string[] = [];
    const spots: string[] = [];

    // Extract mentions
    for (const msg of userMessages) {
      const text = msg.message.toLowerCase();
      if (text.includes('surf')) interests.push('surfing');
      if (text.includes('yoga') || text.includes('wellness')) interests.push('yoga');
      if (text.includes('dive') || text.includes('underwater')) interests.push('diving');
      if (text.includes('hik')) interests.push('hiking');
      if (text.includes('food') || text.includes('wine')) interests.push('gastronomy');
      if (text.includes('aljezur')) spots.push('Aljezur');
      if (text.includes('lagos')) spots.push('Lagos');
      if (text.includes('sagres')) spots.push('Sagres');
      if (text.includes('beginner')) interests.push('beginner level');
      if (text.includes('advanced')) interests.push('advanced level');
    }

    const summary = [
      `Interests: ${[...new Set(interests)].join(', ')}`,
      spots.length > 0 ? `Visited/tried: ${[...new Set(spots)].join(', ')}` : null
    ]
      .filter(Boolean)
      .join('. ');

    return summary || 'Long-time user of bot.';
  }

  /**
   * Get onboarding progress for user
   */
  async getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      const filePath = path.join(this.userDataDir, `${userId}_onboarding.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Save onboarding progress
   */
  async saveOnboardingProgress(userId: string, step: number): Promise<void> {
    try {
      await this.ensureUserDataDir();

      const progress: OnboardingProgress = {
        currentStep: step,
        completedSteps: Array.from({ length: step }, (_, i) => `step_${i}`),
        answeredQuestions: {}
      };

      const filePath = path.join(this.userDataDir, `${userId}_onboarding.json`);
      await fs.writeFile(filePath, JSON.stringify(progress, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    }
  }

  /**
   * Clear onboarding progress after completion
   */
  async clearOnboardingProgress(userId: string): Promise<void> {
    try {
      const filePath = path.join(this.userDataDir, `${userId}_onboarding.json`);
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist, that's fine
    }
  }

  /**
   * Track location event
   */
  async trackLocation(phoneNumber: string, location: string): Promise<void> {
    const user = await this.getUserProfile(phoneNumber);
    if (!user) return;

    user.location.current = location;
    user.location.history.push({
      location,
      timestamp: new Date().toISOString(),
      source: 'manual'
    });

    // Keep only last 20 location events
    if (user.location.history.length > 20) {
      user.location.history = user.location.history.slice(-20);
    }

    await this.saveUserProfile(user);
  }

  /**
   * Hash phone number for privacy (same as conversational agent)
   */
  private hashPhoneNumber(phoneNumber: string): string {
    return `user_${phoneNumber.replace(/\D/g, '')}`;
  }
}
