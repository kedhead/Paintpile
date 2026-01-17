'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toggleLike, isEntityLiked } from '@/lib/firestore/likes';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface LikeButtonProps {
  userId: string;
  targetId: string;
  type?: 'project' | 'army' | 'recipe';
  projectId?: string; // Legacy: if provided, treated as targetId with type='project'
  initialLikeCount?: number;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  size?: 'sm' | 'default' | 'lg';
  showCount?: boolean;
}

export function LikeButton({
  userId,
  targetId: propTargetId,
  type = 'project',
  projectId, // Legacy
  initialLikeCount = 0,
  onLikeChange,
  size = 'default',
  showCount = true,
}: LikeButtonProps) {
  // Resolve targetId from legacy prop if needed
  const targetId = projectId || propTargetId;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  if (!targetId) {
    console.warn("LikeButton: No targetId provided");
    return null;
  }

  useEffect(() => {
    checkLikeStatus();
  }, [userId, targetId, type]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  async function checkLikeStatus() {
    try {
      setCheckingStatus(true);
      const status = await isEntityLiked(userId, targetId, type);
      setLiked(status);
    } catch (err) {
      console.error('Error checking like status:', err);
    } finally {
      setCheckingStatus(false);
    }
  }

  async function handleLikeToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    try {
      setLoading(true);
      // Optimistic update
      const newLikedState = !liked;
      setLiked(newLikedState);
      const newCount = newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1);
      setLikeCount(newCount);
      if (onLikeChange) onLikeChange(newLikedState, newCount);

      const result = await toggleLike(userId, targetId, type);

      // Revert if server result mismatches (rare but possible) or correct it
      if (result.liked !== newLikedState) {
        setLiked(result.liked);
        setLikeCount(initialLikeCount + (result.liked ? 1 : 0)); // Resync
      }

    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert optimistic update
      setLiked(!liked);
      setLikeCount(likeCount);
      alert('Failed to update like status');
    } finally {
      setLoading(false);
    }
  }

  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleLikeToggle}
      disabled={loading || checkingStatus}
      className={cn(
        'gap-2',
        liked && 'text-red-500 hover:text-red-600'
      )}
    >
      <Heart
        className={cn(
          iconSize,
          liked && 'fill-current'
        )}
      />
      {showCount && <span>{likeCount}</span>}
    </Button>
  );
}
