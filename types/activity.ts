import { Timestamp } from 'firebase/firestore';

/**
 * Types of activities that can be tracked
 */
export type ActivityType =
  | 'project_created'      // User created a new project
  | 'project_completed'    // User marked a project as completed
  | 'project_liked'        // User liked a project
  | 'army_created'         // User created a new army
  | 'army_liked'           // User liked an army
  | 'recipe_created'       // User created a new recipe
  | 'recipe_liked'         // User liked a recipe
  | 'user_followed'        // User followed another user
  | 'comment_created'      // User commented on a project/army
  | 'project_updated'      // User updated a project (optional, could be noisy)
  | 'army_updated';        // User updated an army (optional, could be noisy)

/**
 * Type of entity being referenced in activity
 */
export type ActivityTargetType =
  | 'project'
  | 'army'
  | 'recipe'
  | 'comment'
  | 'user';

/**
 * Metadata for different activity types
 */
export interface ActivityMetadata {
  // For project activities
  projectName?: string;
  projectPhotoUrl?: string;

  // For army activities
  armyName?: string;
  armyPhotoUrl?: string;

  // For recipe activities
  recipeName?: string;

  // For user activities
  targetUsername?: string;
  targetDisplayName?: string;
  targetUserPhotoUrl?: string;

  // For comment activities
  commentText?: string;
  commentPreview?: string;    // Truncated version
  targetName?: string;        // Generic target name (polymorphic)

  // Additional context
  status?: string;            // Project status (for project_completed)
  visibility?: 'public' | 'private';
  targetPhotoUrl?: string;
  description?: string;
  likeCount?: number;
  commentCount?: number;
  faction?: string;
}

/**
 * Activity document stored in global activities collection
 * Represents an action taken by a user
 */
export interface Activity {
  activityId: string;
  userId: string;              // User who performed the action
  username: string;            // Denormalized for display
  userPhotoUrl?: string;       // Denormalized for display

  type: ActivityType;

  targetId: string;            // ID of the entity involved
  targetType: ActivityTargetType;

  metadata: ActivityMetadata;

  createdAt: Timestamp;
}

/**
 * Helper type for creating activities
 */
export type CreateActivityData = Omit<Activity, 'activityId' | 'createdAt'>;

/**
 * Activity feed item (for display in UI)
 */
export interface ActivityFeedItem extends Activity {
  // Additional fields that might be populated when rendering
  isPinned?: boolean;
  isHighlighted?: boolean;
}

/**
 * Activity filter options
 */
export interface ActivityFilter {
  types?: ActivityType[];
  userId?: string;             // Filter by specific user
  targetType?: ActivityTargetType;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Activity feed type
 */
export type ActivityFeedType =
  | 'user'                    // Activities from a specific user
  | 'following'               // Activities from users you follow
  | 'global';                 // All public activities

/**
 * Human-readable messages for activity types
 */
export const ACTIVITY_MESSAGES: Record<ActivityType, (metadata: ActivityMetadata) => string> = {
  project_created: (m) => `created a new project: ${m.projectName}`,
  project_completed: (m) => `completed project: ${m.projectName}`,
  project_liked: (m) => `liked project: ${m.projectName}`,
  army_created: (m) => `created a new army: ${m.armyName}`,
  army_liked: (m) => `liked army: ${m.armyName}`,
  recipe_created: (m) => `created a new recipe: ${m.recipeName}`,
  recipe_liked: (m) => `liked recipe: ${m.recipeName}`,
  user_followed: (m) => `followed ${m.targetUsername}`,
  comment_created: (m) => `commented: "${m.commentPreview || m.commentText}"`,
  project_updated: (m) => `updated project: ${m.projectName}`,
  army_updated: (m) => `updated army: ${m.armyName}`,
};
