import fs from 'fs/promises';
import path from 'path';
import { Activity, ActivitySearchQuery, PriceRange, SkillLevel } from '../types/activity';
import { UserPreferences } from '../types/user';

/**
 * Activity matcher - finds and ranks activities based on user preferences
 * Uses semantic matching via simple scoring for MVP
 * TODO: Integrate with AgentDB HNSW for semantic search
 */
export class ActivityMatcher {
  private activities: Activity[] = [];
  private activitiesLoaded: boolean = false;

  constructor() {
    this.loadActivities();
  }

  /**
   * Load activities from JSON file
   */
  private async loadActivities(): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'data', 'activities.json');
      const data = await fs.readFile(filePath, 'utf-8');
      this.activities = JSON.parse(data);
      this.activitiesLoaded = true;
      console.log(`✅ Loaded ${this.activities.length} activities`);
    } catch (error) {
      console.error('Error loading activities:', error);
      this.activities = [];
    }
  }

  /**
   * Ensure activities are loaded
   */
  private async ensureActivitiesLoaded(): Promise<void> {
    if (!this.activitiesLoaded) {
      await this.loadActivities();
    }
  }

  /**
   * Get activity recommendations based on user preferences
   */
  async getRecommendations(
    preferences: UserPreferences,
    limit: number = 5,
    offset: number = 0
  ): Promise<Activity[]> {
    await this.ensureActivitiesLoaded();

    // Score all activities
    const scored = this.activities.map(activity => ({
      activity,
      score: this.calculateMatchScore(activity, preferences)
    }));

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    // Apply offset and limit
    return scored.slice(offset, offset + limit).map(item => item.activity);
  }

  /**
   * Search activities by free-text query
   */
  async searchActivities(query: string, preferences?: UserPreferences): Promise<Activity[]> {
    await this.ensureActivitiesLoaded();

    const lowerQuery = query.toLowerCase();

    // Filter activities that match query keywords
    const matched = this.activities.filter(activity => {
      const searchText = [
        activity.name,
        activity.description,
        activity.category,
        ...activity.tags
      ].join(' ').toLowerCase();

      return searchText.includes(lowerQuery);
    });

    // If preferences provided, score and sort
    if (preferences) {
      const scored = matched.map(activity => ({
        activity,
        score: this.calculateMatchScore(activity, preferences)
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 5).map(item => item.activity);
    }

    return matched.slice(0, 5);
  }

  /**
   * Get activity by ID
   */
  async getActivityById(id: string): Promise<Activity | null> {
    await this.ensureActivitiesLoaded();
    return this.activities.find(a => a.id === id) || null;
  }

  /**
   * Calculate match score between activity and preferences
   * Score range: 0-100
   */
  private calculateMatchScore(activity: Activity, preferences: UserPreferences): number {
    let score = 0;

    // Interest match (40 points max)
    const interestScore = this.calculateInterestScore(activity, preferences.interests);
    score += interestScore * 40;

    // Budget match (20 points max)
    if (preferences.budget) {
      const budgetScore = this.calculateBudgetScore(activity.priceRange, preferences.budget);
      score += budgetScore * 20;
    } else {
      score += 10; // Neutral if no budget specified
    }

    // Skill level match (20 points max)
    if (preferences.skillLevel) {
      const skillScore = this.calculateSkillScore(activity.skillLevel, preferences.skillLevel);
      score += skillScore * 20;
    } else {
      score += 10; // Neutral if no skill specified
    }

    // Group size match (10 points max)
    if (preferences.groupSize) {
      const groupScore = this.calculateGroupScore(activity.groupSize, preferences.groupSize);
      score += groupScore * 10;
    } else {
      score += 5; // Neutral
    }

    // Season/availability (10 points max)
    // For MVP, assume all year-round activities get full points
    if (activity.season === 'year-round') {
      score += 10;
    } else {
      score += 5;
    }

    return Math.round(score);
  }

  /**
   * Calculate interest match score (0-1)
   */
  private calculateInterestScore(activity: Activity, interests: string[]): number {
    if (interests.length === 0 || interests.includes('general')) {
      return 0.5; // Neutral score
    }

    // Check if activity category or tags match any interest
    const activityTerms = [
      activity.category,
      ...activity.tags
    ].map(t => t.toLowerCase());

    let matchCount = 0;
    for (const interest of interests) {
      if (activityTerms.some(term => term.includes(interest.toLowerCase()) || interest.toLowerCase().includes(term))) {
        matchCount++;
      }
    }

    return Math.min(matchCount / interests.length, 1);
  }

  /**
   * Calculate budget match score (0-1)
   */
  private calculateBudgetScore(activityPrice: PriceRange, userBudget: PriceRange): number {
    const priceValues: Record<PriceRange, number> = {
      '€': 1,
      '€€': 2,
      '€€€': 3
    };

    const activityValue = priceValues[activityPrice];
    const budgetValue = priceValues[userBudget];

    // Exact match = 1.0
    if (activityValue === budgetValue) return 1.0;

    // Activity cheaper than budget = 0.8 (still good)
    if (activityValue < budgetValue) return 0.8;

    // Activity more expensive = penalty based on difference
    const difference = activityValue - budgetValue;
    return Math.max(0, 1 - (difference * 0.3));
  }

  /**
   * Calculate skill level match score (0-1)
   */
  private calculateSkillScore(activityLevels: SkillLevel[], userLevel: SkillLevel): number {
    // If activity supports user's skill level, perfect match
    if (activityLevels.includes(userLevel)) return 1.0;

    // If activity supports beginner and user is intermediate/advanced, still good
    if (activityLevels.includes('beginner') && userLevel !== 'beginner') {
      return 0.7;
    }

    // If activity is advanced-only but user is beginner, poor match
    if (activityLevels.includes('advanced') && !activityLevels.includes('beginner') && userLevel === 'beginner') {
      return 0.3;
    }

    return 0.5; // Neutral
  }

  /**
   * Calculate group size match score (0-1)
   */
  private calculateGroupScore(activityGroupSize: string, userGroupSize: number): number {
    // Small groups: 1-3
    if (userGroupSize <= 3) {
      return activityGroupSize === 'small' ? 1.0 : 0.7;
    }

    // Medium groups: 4-6
    if (userGroupSize <= 6) {
      return activityGroupSize === 'medium' ? 1.0 : 0.7;
    }

    // Large groups: 7+
    return activityGroupSize === 'large' ? 1.0 : 0.5;
  }
}
