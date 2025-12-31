import { Timestamp } from 'firebase/firestore';

export interface User {
  userId: string;
  email: string;
  displayName: string;
  username?: string;
  bio?: string;
  photoURL?: string;
  createdAt: Timestamp;
  settings: UserSettings;
  stats: UserStats;
}

export interface UserSettings {
  publicProfile: boolean;
  showPileStats: boolean;
}

export interface UserStats {
  projectCount: number;
  photoCount: number;
  pileCount: number;
}

export type UserFormData = Omit<User, 'userId' | 'createdAt' | 'stats'>;
