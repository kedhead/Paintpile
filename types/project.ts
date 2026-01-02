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
  likeCount: number;
  commentCount: number;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  status: ProjectStatus;
  quantity?: number;
  tags?: string[];
  startDate?: Date;
}
