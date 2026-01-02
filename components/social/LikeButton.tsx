'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { likeProject, unlikeProject, isProjectLiked } from '@/lib/firestore/likes';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface LikeButtonProps {
  userId: string;
  projectId: string;
  initialLikeCount?: number;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function LikeButton({
  userId,
  projectId,
  initialLikeCount = 0,
  onLikeChange,
  size = 'md',
  showCount = true,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkLikeStatus();
  }, [userId, projectId]);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  async function checkLikeStatus() {
    try {
      setCheckingStatus(true);
      const status = await isProjectLiked(userId, projectId);
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

      if (liked) {
        await unlikeProject(userId, projectId);
        setLiked(false);
        const newCount = Math.max(0, likeCount - 1);
        setLikeCount(newCount);
        if (onLikeChange) onLikeChange(false, newCount);
      } else {
        await likeProject(userId, projectId);
        setLiked(true);
        const newCount = likeCount + 1;
        setLikeCount(newCount);
        if (onLikeChange) onLikeChange(true, newCount);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
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
