import { Timestamp } from 'firebase/firestore';

export type ProjectStatus = 'not-started' | 'in-progress' | 'completed';

export interface Project {
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  quantity?: number;
  tags: string[];
  startDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublic: boolean;
  photoCount: number;
  paintCount: number;
  featuredPhotoId?: string;
  coverPhotoUrl?: string;      // Denormalized URL for feed/lists
  likeCount: number;
  commentCount: number;
  armyIds?: string[];          // IDs of armies this project belongs to
  lastCritique?: {
    score: number;
    grade: string;
    analysis: string;
    colors: string;
    technical_strengths: string[];
    improvements: string[];
    createdAt: Timestamp;
  };
}

export interface ProjectFormData {
  name: string;
  coverPhotoUrl?: string;      // Optional cover photo URL
  description?: string;
  status: ProjectStatus;
  quantity?: number;
  tags?: string[];
  startDate?: Date;
}
