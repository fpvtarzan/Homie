import Anthropic from '@anthropic-ai/sdk';
import { SurfDataService, SurfCondition } from '../services/surf-data';
import { UserPreferences } from '../types/user';

/**
 * Surf-specific agent — sends terse, actionable messages
 * Used for:
 * - 8am forecast: "Best spot for you today + alternatives"
 * - Post-tide check: "How was it? + activity suggestion if tired"
 */
export class SurfAgent {
  private client: Anthropic | null = null;
  private surfData: SurfDataService;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey.length > 10) {
      this.client = new Anthropic({ apiKey });
    }
    this.surfData = new SurfDataService();
  }

  /**
   * Generate 8am forecast message (terse, 1-2 lines max)
   */
  async generateMorningForecast(preferences: UserPreferences): Promise<string> {
    try {
      const skillLevel = (preferences.skillLevel || 'intermediate') as any;
      const { best, alternatives } = await this.surfData.getBestSpot(skillLevel);

      const prompt = this.buildMorningPrompt(best, alternatives, skillLevel);

      if (!this.client) {
        return this.formatFallbackForecast(best, alternatives);
      }

      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: `You are a WhatsApp surf concierge. Send ULTRA-SHORT messages (1-2 lines max).
No emojis. No markdown. Just the spot name, why it's good, and 1 alternative. Plain text only.`,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return text.length > 200 ? text.substring(0, 200) : text;
    } catch (error) {
      console.error('Surf forecast error:', error);
      return 'Check the forecast yourself on Magicseaweed! 🌊';
    }
  }

  /**
   * Generate post-tide check-in (ask how it was, suggest activity if needed)
   */
  async generateCheckIn(
    preferences: UserPreferences,
    otherActivitiesOfInterest?: string[]
  ): Promise<string> {
    try {
      if (!this.client) {
        return this.getSimpleCheckIn(otherActivitiesOfInterest);
      }

      const activities = otherActivitiesOfInterest?.length
        ? `User also interested in: ${otherActivitiesOfInterest.join(', ')}`
        : '';

      const prompt = `How was the surf? If they say they're tired/done, suggest one of these: ${activities || 'relax at a café'}`;

      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: `You are WhatsApp concierge. Ask ONE simple question. Ultra short. No emoji. Plain text.
If they mention fatigue, suggest exactly ONE alternative activity. Max 1 line.`,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      return text.length > 150 ? text.substring(0, 150) : text;
    } catch (error) {
      return this.getSimpleCheckIn(otherActivitiesOfInterest);
    }
  }

  /**
   * Build morning forecast prompt
   */
  private buildMorningPrompt(
    best: SurfCondition,
    alternatives: SurfCondition[],
    level: string
  ): string {
    const altText = alternatives
      .map(a => `${a.spot} (${a.waveHeight}m, rating ${a.rating}/10)`)
      .join(', ');

    return `Best spot today for ${level} surfer:
${best.spot} - ${best.waveHeight}m waves, ${best.windSpeed} knot wind, ${best.recommendation}
Tide changes at ${best.tideTime}

Alternatives: ${altText}

Format as: "Go to [SPOT] — [WHY]
Or try [ALT1] / [ALT2]"
Keep it 2 lines max, plain text, no emojis`;
  }

  /**
   * Fallback forecast (no AI)
   */
  private formatFallbackForecast(best: SurfCondition, alternatives: SurfCondition[]): string {
    const altNames = alternatives.map(a => a.spot).join(' / ');
    return `${best.spot} is best today (${best.waveHeight}m). Tide at ${best.tideTime}.\nAlso try: ${altNames}`;
  }

  /**
   * Simple check-in (no AI)
   */
  private getSimpleCheckIn(activities?: string[]): string {
    const suggestion = activities?.[0] ? `or try ${activities[0]}` : 'or relax with a coffee';
    return `How was it? ${suggestion}`;
  }
}
