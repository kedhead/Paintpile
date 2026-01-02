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
