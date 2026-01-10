import { Timestamp } from 'firebase/firestore';

export type TimelineEventType =
  | 'project_created'
  | 'project_updated'
  | 'photo_added'
  | 'paint_added'
  | 'recipe_created'
  | 'recipe_updated'
  | 'technique_added'
  | 'status_changed'
  | 'annotation_added';

export interface TimelineEvent {
  eventId: string;
  projectId: string;
  userId: string;
  type: TimelineEventType;
  timestamp: Timestamp;
  metadata: TimelineEventMetadata;
}

export interface TimelineEventMetadata {
  // Photo events
  photoId?: string;
  photoUrl?: string;
  photoCaption?: string;

  // Paint events
  paintId?: string;
  paintName?: string;
  paintBrand?: string;

  // Recipe events
  recipeId?: string;
  recipeName?: string;
  recipeDescription?: string;

  // Technique events
  techniqueId?: string;
  techniqueName?: string;
  techniqueCategory?: string;

  // Status change events
  oldStatus?: string;
  newStatus?: string;

  // General
  description?: string;
}

// Helper type for event labels
export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  project_created: 'Project Created',
  project_updated: 'Project Updated',
  photo_added: 'Photo Added',
  paint_added: 'Paint Added',
  recipe_created: 'Recipe Created',
  recipe_updated: 'Recipe Updated',
  technique_added: 'Technique Added',
  status_changed: 'Status Changed',
  annotation_added: 'Annotation Added',
};
