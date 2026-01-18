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
  getDoc,
  arrayUnion,
  arrayRemove,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Photo, PhotoAnnotation } from '@/types/photo';
import { incrementUserStats } from './users';
import { createTimelineEvent } from './timeline';

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

  // Join user stats update
  await incrementUserStats(userId, 'photoCount', 1);

  // Update "Project Created" activity with this photo if it's the first one (or just update it generally)
  // This ensures the feed shows a rich card with the hero image
  try {
    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef,
      where('type', '==', 'project_created'),
      where('targetId', '==', projectId),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const activityDoc = snapshot.docs[0];
      const currentMetadata = activityDoc.data().metadata || {};

      // Update if no photo URL or just always update to the latest
      await updateDoc(activityDoc.ref, {
        'metadata.projectPhotoUrl': photoData.thumbnailUrl || photoData.url
      });
    }
  } catch (err) {
    console.error('Error updating activity metadata with new photo:', err);
  }

  // Create timeline event
  await createTimelineEvent(projectId, userId, 'photo_added', {
    photoId,
    photoUrl: photoData.thumbnailUrl,
    photoCaption: photoData.caption || '',
  });

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

/**
 * Add an annotation to a photo
 */
export async function addAnnotationToPhoto(
  projectId: string,
  photoId: string,
  annotation: PhotoAnnotation,
  userId?: string
): Promise<void> {
  const photoRef = doc(db, 'projects', projectId, 'photos', photoId);
  await updateDoc(photoRef, {
    annotations: arrayUnion(annotation),
  });

  // Create timeline event if userId provided
  if (userId) {
    await createTimelineEvent(projectId, userId, 'annotation_added', {
      photoId,
      description: `Added annotation: ${annotation.label}`,
    });
  }
}

/**
 * Update an annotation on a photo
 */
export async function updateAnnotation(
  projectId: string,
  photoId: string,
  annotationId: string,
  updates: Partial<PhotoAnnotation>
): Promise<void> {
  const photoRef = doc(db, 'projects', projectId, 'photos', photoId);
  const photoSnap = await getDoc(photoRef);

  if (!photoSnap.exists()) {
    throw new Error('Photo not found');
  }

  const photo = photoSnap.data() as Photo;
  const annotations = photo.annotations || [];

  const updatedAnnotations = annotations.map((ann) =>
    ann.id === annotationId ? { ...ann, ...updates } : ann
  );

  await updateDoc(photoRef, {
    annotations: updatedAnnotations,
  });
}

/**
 * Delete an annotation from a photo
 */
export async function deleteAnnotation(
  projectId: string,
  photoId: string,
  annotationId: string
): Promise<void> {
  const photoRef = doc(db, 'projects', projectId, 'photos', photoId);
  const photoSnap = await getDoc(photoRef);

  if (!photoSnap.exists()) {
    throw new Error('Photo not found');
  }

  const photo = photoSnap.data() as Photo;
  const annotations = photo.annotations || [];

  const updatedAnnotations = annotations.filter((ann) => ann.id !== annotationId);

  await updateDoc(photoRef, {
    annotations: updatedAnnotations,
  });
}

/**
 * Move an annotation to a new position
 */
export async function moveAnnotation(
  projectId: string,
  photoId: string,
  annotationId: string,
  x: number,
  y: number
): Promise<void> {
  await updateAnnotation(projectId, photoId, annotationId, { x, y });
}
