import { format, formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

/**
 * Format a Firebase Timestamp to a readable date string
 */
export function formatDate(timestamp: Timestamp | Date, formatString: string = 'PPP'): string {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return format(date, formatString);
}

/**
 * Format a Firebase Timestamp as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: Timestamp | Date): string {
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
