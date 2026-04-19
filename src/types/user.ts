import { PriceRange, SkillLevel } from './activity';

export interface UserProfile {
  userId: string;              // Hashed WhatsApp phone
  phoneNumber: string;         // Original phone number
  conversationState: ConversationState;
  preferences: UserPreferences;
  location: LocationData;
  conversationHistory: ConversationMessage[];
  conversationSummary?: string; // Condensed summary of past conversations for memory
  checkInScheduledFor?: string; // ISO timestamp for when to send surf check-in (tide time + 5h)
  createdAt: string;
  lastActiveAt: string;
}

export type ConversationState =
  | 'new'              // First interaction
  | 'onboarding'       // Collecting preferences
  | 'active'           // Preferences complete, can receive recommendations
  | 'churned';         // Inactive for 30+ days

export interface UserPreferences {
  interests: string[];         // ["surfing", "yoga", "nature"]
  budget?: PriceRange;         // "budget" | "mid-range" | "luxury"
  groupSize?: number;
  skillLevel?: SkillLevel;     // "beginner" | "intermediate" | "advanced"
  dates?: {
    arrival: string;           // ISO date
    departure: string;
  };
}

export interface LocationData {
  current: string;             // "Algarve" | "Lisbon" | "UK"
  history: LocationEvent[];
}

export interface LocationEvent {
  location: string;
  timestamp: string;
  source: 'manual' | 'gps';
}

export interface ConversationMessage {
  timestamp: string;
  message: string;
  sender: 'user' | 'bot';
  metadata?: {
    intent?: string;
    activityIds?: string[];
  };
}

export interface OnboardingProgress {
  currentStep: number;         // 0-5 (0 = not started, 5 = complete)
  completedSteps: string[];
  answeredQuestions: Record<string, any>;
}

export interface UserSession {
  userId: string;
  startTime: string;
  lastMessageTime: string;
  messageCount: number;
  onboardingProgress?: OnboardingProgress;
}
