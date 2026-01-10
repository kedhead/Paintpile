import { Timestamp } from 'firebase/firestore';

/**
 * Army Collections System
 * Allows users to group multiple projects together into armies/collections
 */

/**
 * Main Army entity
 * Represents a collection of projects (e.g., "Space Marine Army", "Orc Warband")
 */
export interface Army {
  armyId: string;
  userId: string;
  name: string;
  description?: string;
  projectIds: string[];        // IDs of projects in this army
  tags: string[];
  faction?: string;            // e.g., "Space Marines", "Orks", "Eldar"
  armySize?: number;           // Total model count (sum of project quantities)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublic: boolean;
  featuredPhotoId?: string;    // Photo ID from one of the member projects
  customPhotoUrl?: string;     // Optional custom group shot
  likeCount: number;
  commentCount: number;
}

/**
 * Army member relationship
 * Stored in subcollection: armies/{armyId}/members
 * Links projects to armies with additional metadata
 */
export interface ArmyMember {
  memberId: string;            // Same as projectId for simplicity
  projectId: string;
  addedAt: Timestamp;
  role?: string;               // e.g., "HQ", "Troops", "Elites", "Heavy Support"
  notes?: string;              // Optional notes about this project's role
}

/**
 * Form data for creating/editing armies
 */
export interface ArmyFormData {
  name: string;
  description?: string;
  faction?: string;
  tags?: string[];
}

/**
 * Unified gallery item type for displaying both projects and armies
 */
export type GalleryItemType = 'project' | 'army';

export type GalleryItem =
  | { type: 'project'; data: any; coverPhoto?: string }  // Use Project type
  | { type: 'army'; data: Army; coverPhoto?: string };

/**
 * Popular faction options (can be customized by users)
 */
export const POPULAR_FACTIONS = [
  'Space Marines',
  'Chaos Space Marines',
  'Orks',
  'Aeldari / Eldar',
  'Necrons',
  'Tyranids',
  'Imperial Guard / Astra Militarum',
  'T\'au Empire',
  'Death Guard',
  'Thousand Sons',
  'Other / Custom',
] as const;
