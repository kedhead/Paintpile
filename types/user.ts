import { Timestamp } from 'firebase/firestore';

export interface User {
  userId: string;
  email: string;
  displayName: string;
  username?: string;
  usernameLower?: string; // For case-insensitive username lookups
  bio?: string;
  photoURL?: string;
  createdAt: Timestamp;
  settings: UserSettings;
  stats: UserStats;
  subscription?: UserSubscription;
  features?: UserFeatures;
}

export interface UserSubscription {
  tier: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Timestamp;
  currentPeriodEnd?: Timestamp;
  cancelAtPeriodEnd?: boolean;
}

export interface UserFeatures {
  aiEnabled?: boolean;  // Admin can manually enable AI for testing
}

export interface UserSettings {
  publicProfile: boolean;
  showPileStats: boolean;
  isPublic?: boolean;
  emailNotifications?: boolean;
  theme?: 'light' | 'dark';
}

export interface UserStats {
  projectCount: number;
  photoCount: number;
  pileCount: number;
  paintCount: number;
  followerCount: number;
  followingCount: number;
}

export type UserFormData = Omit<User, 'userId' | 'createdAt' | 'stats'>;
