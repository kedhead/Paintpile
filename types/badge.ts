import { Timestamp } from 'firebase/firestore';

/**
 * Badge ID is now dynamic (string)
 */
export type BadgeType = string;

/**
 * Badge tier/rarity
 */
export type BadgeTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'legendary';

/**
 * Badge category for organization
 */
export type BadgeCategory =
  | 'projects'
  | 'armies'
  | 'recipes'
  | 'social'
  | 'community'
  | 'special'
  | 'time'
  | 'engagement';

/**
 * Badge definition (Stored in 'badges' collection)
 */
export interface Badge {
  id: string;                 // Firestore Doc ID (was type)
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string;               // Emoji or Lucide icon name or URL
  color: string;
  requirement: string;
  points: number;
  hidden?: boolean;
  createdAt?: string;         // ISO date

  // Automation Logic
  trigger_type?: 'manual' | 'stat_milestone';
  trigger_field?: string;     // e.g. 'diaryEntryCount', 'projectCount'
  trigger_value?: number;     // e.g. 1, 10, 50
}

/**
 * User's earned badge (stored in users/{userId}/earned_badges)
 */
export interface UserBadge {
  badgeId: string;            // Link to Badge.id
  userId: string;
  earnedAt: Timestamp;
  notificationSent?: boolean;
  showcased?: boolean;
}

/**
 * Helper type for creating badges
 */
export type CreateBadgeData = Omit<Badge, 'id' | 'createdAt'>;


/**
 * All badge definitions (Seed Data)
 */
export const BADGE_DEFINITIONS: Record<string, Omit<Badge, 'id' | 'createdAt'>> = {
  // Project badges
  first_project: {
    name: 'First Paint',
    description: 'Created your first project',
    category: 'projects',
    tier: 'bronze',
    icon: '🎨',
    color: '#CD7F32',
    requirement: 'Create 1 project',
    points: 10,
  },
  project_10: {
    name: 'Dedicated Painter',
    description: 'Created 10 projects',
    category: 'projects',
    tier: 'silver',
    icon: '🖌️',
    color: '#C0C0C0',
    requirement: 'Create 10 projects',
    points: 50,
  },
  project_50: {
    name: 'Master Painter',
    description: 'Created 50 projects',
    category: 'projects',
    tier: 'gold',
    icon: '🏆',
    color: '#FFD700',
    requirement: 'Create 50 projects',
    points: 250,
  },
  project_100: {
    name: 'Legendary Painter',
    description: 'Created 100 projects',
    category: 'projects',
    tier: 'platinum',
    icon: '👑',
    color: '#E5E4E2',
    requirement: 'Create 100 projects',
    points: 500,
  },
  completed_10: {
    name: 'Finisher',
    description: 'Completed 10 projects',
    category: 'projects',
    tier: 'silver',
    icon: '✅',
    color: '#C0C0C0',
    requirement: 'Complete 10 projects',
    points: 75,
  },
  completed_50: {
    name: 'Completionist',
    description: 'Completed 50 projects',
    category: 'projects',
    tier: 'gold',
    icon: '🎖️',
    color: '#FFD700',
    requirement: 'Complete 50 projects',
    points: 300,
  },
  completed_100: {
    name: 'Ultimate Completionist',
    description: 'Completed 100 projects',
    category: 'projects',
    tier: 'platinum',
    icon: '💎',
    color: '#E5E4E2',
    requirement: 'Complete 100 projects',
    points: 600,
  },

  // Army badges
  first_army: {
    name: 'Army Builder',
    description: 'Created your first army',
    category: 'armies',
    tier: 'bronze',
    icon: '🛡️',
    color: '#8B008B',
    requirement: 'Create 1 army',
    points: 20,
  },
  army_10: {
    name: 'General',
    description: 'Created 10 armies',
    category: 'armies',
    tier: 'gold',
    icon: '⚔️',
    color: '#FFD700',
    requirement: 'Create 10 armies',
    points: 200,
  },
  large_army: {
    name: 'Warlord',
    description: 'Built an army with 50+ models',
    category: 'armies',
    tier: 'gold',
    icon: '🏰',
    color: '#FFD700',
    requirement: 'Create army with 50+ models',
    points: 150,
  },

  // Recipe badges
  recipe_creator: {
    name: 'Recipe Creator',
    description: 'Created your first recipe',
    category: 'recipes',
    tier: 'bronze',
    icon: '📖',
    color: '#CD7F32',
    requirement: 'Create 1 recipe',
    points: 15,
  },
  recipe_10: {
    name: 'Recipe Collector',
    description: 'Created 10 recipes',
    category: 'recipes',
    tier: 'silver',
    icon: '📚',
    color: '#C0C0C0',
    requirement: 'Create 10 recipes',
    points: 100,
  },
  recipe_master: {
    name: 'Recipe Master',
    description: 'Created 50 recipes',
    category: 'recipes',
    tier: 'gold',
    icon: '🎓',
    color: '#FFD700',
    requirement: 'Create 50 recipes',
    points: 400,
  },
  ai_recipe_pioneer: {
    name: 'AI Pioneer',
    description: 'Used AI to generate a recipe',
    category: 'recipes',
    tier: 'silver',
    icon: '🤖',
    color: '#4A90E2',
    requirement: 'Generate 1 AI recipe',
    points: 25,
  },
  ai_critic_user: {
    name: 'Brave Soul',
    description: 'Sought the harsh judgment of the AI Critic',
    category: 'special',
    tier: 'bronze',
    icon: '⚖️',
    color: '#9B59B6',
    requirement: 'Use AI Paint Critic',
    points: 10,
  },

  // Social badges
  likes_50: {
    name: 'Well Liked',
    description: 'Received 50 likes',
    category: 'social',
    tier: 'bronze',
    icon: '❤️',
    color: '#FF6B6B',
    requirement: 'Receive 50 likes',
    points: 50,
  },
  likes_500: {
    name: 'Popular',
    description: 'Received 500 likes',
    category: 'social',
    tier: 'silver',
    icon: '💕',
    color: '#FF69B4',
    requirement: 'Receive 500 likes',
    points: 250,
  },
  likes_1000: {
    name: 'Beloved',
    description: 'Received 1000 likes',
    category: 'social',
    tier: 'gold',
    icon: '💖',
    color: '#FFD700',
    requirement: 'Receive 1000 likes',
    points: 500,
  },
  follower_10: {
    name: 'Rising Star',
    description: 'Have 10 followers',
    category: 'social',
    tier: 'bronze',
    icon: '⭐',
    color: '#CD7F32',
    requirement: 'Gain 10 followers',
    points: 50,
  },
  follower_100: {
    name: 'Community Figure',
    description: 'Have 100 followers',
    category: 'social',
    tier: 'silver',
    icon: '🌟',
    color: '#C0C0C0',
    requirement: 'Gain 100 followers',
    points: 300,
  },
  follower_500: {
    name: 'Celebrity',
    description: 'Have 500 followers',
    category: 'social',
    tier: 'gold',
    icon: '✨',
    color: '#FFD700',
    requirement: 'Gain 500 followers',
    points: 750,
  },
  influencer: {
    name: 'Influencer',
    description: 'Have 1000 followers',
    category: 'social',
    tier: 'platinum',
    icon: '🔥',
    color: '#E5E4E2',
    requirement: 'Gain 1000 followers',
    points: 1500,
  },

  // Community badges
  commenter: {
    name: 'Commenter',
    description: 'Left 50 comments',
    category: 'community',
    tier: 'bronze',
    icon: '💬',
    color: '#87CEEB',
    requirement: 'Leave 50 comments',
    points: 50,
  },
  helpful: {
    name: 'Helpful',
    description: 'Received 10 likes on comments',
    category: 'community',
    tier: 'silver',
    icon: '🤝',
    color: '#90EE90',
    requirement: 'Get 10 likes on comments',
    points: 100,
  },
  community_leader: {
    name: 'Community Leader',
    description: 'Top contributor to the community',
    category: 'community',
    tier: 'legendary',
    icon: '🏅',
    color: '#FF4500',
    requirement: 'Be a top contributor',
    points: 2000,
    hidden: true,
  },

  // Special badges
  early_adopter: {
    name: 'Early Adopter',
    description: 'Joined during beta/early access',
    category: 'special',
    tier: 'gold',
    icon: '🚀',
    color: '#FFD700',
    requirement: 'Join during beta period',
    points: 100,
  },
  pro_user: {
    name: 'Pro User',
    description: 'Subscribed to Pro plan',
    category: 'special',
    tier: 'platinum',
    icon: '💼',
    color: '#4A90E2',
    requirement: 'Subscribe to Pro',
    points: 0,
  },
  verified_artist: {
    name: 'Verified Artist',
    description: 'Verified professional miniature painter',
    category: 'special',
    tier: 'legendary',
    icon: '✓',
    color: '#1DA1F2',
    requirement: 'Verification by staff',
    points: 0,
    hidden: true,
  },
  competition_winner: {
    name: 'Competition Winner',
    description: 'Won a community painting competition',
    category: 'special',
    tier: 'legendary',
    icon: '🥇',
    color: '#FFD700',
    requirement: 'Win a competition',
    points: 500,
  },
  curator: {
    name: 'Curator',
    description: 'Selected to curate featured content',
    category: 'special',
    tier: 'legendary',
    icon: '📌',
    color: '#9B59B6',
    requirement: 'Selected by staff',
    points: 0,
    hidden: true,
  },

  // Time-based badges
  one_year: {
    name: 'One Year Anniversary',
    description: 'Active for 1 year',
    category: 'time',
    tier: 'silver',
    icon: '🎂',
    color: '#C0C0C0',
    requirement: 'Be active for 1 year',
    points: 100,
  },
  three_year: {
    name: 'Three Year Veteran',
    description: 'Active for 3 years',
    category: 'time',
    tier: 'gold',
    icon: '🎉',
    color: '#FFD700',
    requirement: 'Be active for 3 years',
    points: 300,
  },
  veteran: {
    name: 'Veteran',
    description: 'Active for 5 years',
    category: 'time',
    tier: 'legendary',
    icon: '🏛️',
    color: '#FF4500',
    requirement: 'Be active for 5 years',
    points: 1000,
  },

  // Engagement badges
  streak_7: {
    name: '7-Day Streak',
    description: 'Active for 7 days in a row',
    category: 'engagement',
    tier: 'bronze',
    icon: '🔥',
    color: '#FF6B6B',
    requirement: '7-day activity streak',
    points: 25,
  },
  streak_30: {
    name: '30-Day Streak',
    description: 'Active for 30 days in a row',
    category: 'engagement',
    tier: 'gold',
    icon: '🔥',
    color: '#FF4500',
    requirement: '30-day activity streak',
    points: 200,
  },
  daily_visitor: {
    name: 'Daily Visitor',
    description: 'Visited the app daily for a month',
    category: 'engagement',
    tier: 'silver',
    icon: '📅',
    color: '#87CEEB',
    requirement: 'Visit daily for 30 days',
    points: 150,
  },
};
