import { Timestamp } from 'firebase/firestore';

export type ProjectStatus = 'not-started' | 'in-progress' | 'completed';
export type ProjectType = 'warhammer' | 'd&d' | 'historical' | 'other';

export interface Project {
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  startDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublic: boolean;
  photoCount: number;
  paintCount: number;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  startDate?: Date;
}
