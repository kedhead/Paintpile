import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { TimelineEvent, TimelineEventType, TimelineEventMetadata } from '@/types/timeline';

/**
 * Create a timeline event
 */
export async function createTimelineEvent(
  projectId: string,
  userId: string,
  type: TimelineEventType,
  metadata: TimelineEventMetadata
): Promise<string> {
  const timelineRef = collection(db, 'projects', projectId, 'timeline');
  const newEventRef = doc(timelineRef);

  const event: TimelineEvent = {
    eventId: newEventRef.id,
    projectId,
    userId,
    type,
    timestamp: serverTimestamp() as any,
    metadata,
  };

  await setDoc(newEventRef, event);

  return newEventRef.id;
}

/**
 * Get timeline events for a project with pagination
 */
export async function getProjectTimeline(
  projectId: string,
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ events: TimelineEvent[]; lastDoc: QueryDocumentSnapshot | null }> {
  const timelineRef = collection(db, 'projects', projectId, 'timeline');

  let q = query(
    timelineRef,
    orderBy('timestamp', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(
      timelineRef,
      orderBy('timestamp', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const querySnapshot = await getDocs(q);
  const events = querySnapshot.docs.map((doc) => doc.data() as TimelineEvent);
  const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;

  return { events, lastDoc: newLastDoc };
}

/**
 * Delete a timeline event
 */
export async function deleteTimelineEvent(
  projectId: string,
  eventId: string
): Promise<void> {
  const eventRef = doc(db, 'projects', projectId, 'timeline', eventId);
  await deleteDoc(eventRef);
}

/**
 * Helper function to track project updates
 */
export async function trackProjectUpdate(
  projectId: string,
  userId: string,
  description: string
): Promise<void> {
  await createTimelineEvent(projectId, userId, 'project_updated', {
    description,
  });
}
