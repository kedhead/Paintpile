import { Timestamp } from 'firebase/firestore';

export interface Photo {
  photoId: string;
  userId: string;
  projectId: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  createdAt: Timestamp;
  width: number;
  height: number;
}

export interface PhotoUpload {
  file: File;
  preview: string;
  caption?: string;
}
