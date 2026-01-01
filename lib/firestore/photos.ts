import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Photo } from '@/types/photo';
import { incrementUserStats } from './users';

/**
 * Add a photo to a project
 */
export async function addPhotoToProject(
  userId: string,
  projectId: string,
  photoData: {
    url: string;
    thumbnailUrl: string;
    caption?: string;
    paintIds?: string[];
    width: number;
    height: number;
  }
): Promise<string> {
  const photosRef = collection(db, 'projects', projectId, 'photos');
  const newPhotoRef = doc(photosRef);
  const photoId = newPhotoRef.id;

  const photo = {
    photoId,
    userId,
    projectId,
    url: photoData.url,
    thumbnailUrl: photoData.thumbnailUrl,
    caption: photoData.caption || '',
    paintIds: photoData.paintIds || [],
    width: photoData.width,
    height: photoData.height,
    createdAt: serverTimestamp(),
  };

  await setDoc(newPhotoRef, photo);

  // Increment project photo count
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    photoCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  // Increment user photo count
  await incrementUserStats(userId, 'photoCount', 1);

  return photoId;
}

/**
 * Get all photos for a project
 */
export async function getProjectPhotos(projectId: string): Promise<Photo[]> {
  const photosRef = collection(db, 'projects', projectId, 'photos');
  const q = query(photosRef, orderBy('createdAt', 'desc'));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Photo);
}

/**
 * Delete a photo
 */
export async function deletePhotoFromProject(
  userId: string,
  projectId: string,
  photoId: string
): Promise<void> {
  const photoRef = doc(db, 'projects', projectId, 'photos', photoId);
  await deleteDoc(photoRef);

  // Decrement project photo count
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    photoCount: increment(-1),
    updatedAt: serverTimestamp(),
  });

  // Decrement user photo count
  await incrementUserStats(userId, 'photoCount', -1);
}

/**
 * Update photo caption
 */
export async function updatePhotoCaption(
  projectId: string,
  photoId: string,
  caption: string
): Promise<void> {
  const photoRef = doc(db, 'projects', projectId, 'photos', photoId);
  await updateDoc(photoRef, { caption });
}
