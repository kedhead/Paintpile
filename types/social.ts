import { Timestamp } from 'firebase/firestore';

export interface Follow {
  followId: string;
  followerId: string;     // User following
  followingId: string;    // User being followed
  createdAt: Timestamp;
}

export interface Like {
  likeId: string;
  userId: string;
  projectId: string;
  createdAt: Timestamp;
}

export interface Comment {
  commentId: string;
  projectId: string;
  userId: string;
  username: string;
  userPhotoURL?: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  edited: boolean;
}
