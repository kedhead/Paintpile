import { Timestamp } from 'firebase/firestore';
import { NotificationPreferences } from './notification';

export interface User {
  userId: string;
  email: string;
  displayName: string;
  username?: string;
  usernameLower?: string; // For case-insensitive username lookups
  bio?: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp; // timestamp of last login session
  lastActiveAt?: Timestamp; // timestamp of last user activity
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
  notificationPreferences?: NotificationPreferences;
  socialLinks?: SocialLinks;
}

/**
 * User's social media links
 */
export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
  facebook?: string;
  tiktok?: string;
}

export interface UserStats {
  projectCount: number;
  photoCount: number;
  pileCount: number;
  paintCount: number;
  followerCount: number;
  followingCount: number;

  // Community stats (Phase 2)
  armyCount: number;
  likesReceived: number;
  recipesCreated: number;
  badgeCount: number;
  commentCount: number;
  commentsReceived: number;
  diaryEntryCount: number;
}

export type UserFormData = Omit<User, 'userId' | 'createdAt' | 'stats'>;
