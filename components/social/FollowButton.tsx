'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { followUser, unfollowUser, isFollowing } from '@/lib/firestore/follows';
import { UserPlus, UserMinus } from 'lucide-react';

interface FollowButtonProps {
  currentUserId: string;
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline';
}

export function FollowButton({
  currentUserId,
  targetUserId,
  onFollowChange,
  size = 'default',
  variant = 'default',
}: FollowButtonProps) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [currentUserId, targetUserId]);

  async function checkFollowStatus() {
    try {
      setCheckingStatus(true);
      const status = await isFollowing(currentUserId, targetUserId);
      setFollowing(status);
    } catch (err) {
      console.error('Error checking follow status:', err);
    } finally {
      setCheckingStatus(false);
    }
  }

  async function handleFollowToggle() {
    if (loading) return;

    try {
      setLoading(true);

      if (following) {
        await unfollowUser(currentUserId, targetUserId);
        setFollowing(false);
        if (onFollowChange) onFollowChange(false);
      } else {
        await followUser(currentUserId, targetUserId);
        setFollowing(true);
        if (onFollowChange) onFollowChange(true);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Failed to update follow status');
    } finally {
      setLoading(false);
    }
  }

  if (checkingStatus) {
    return (
      <Button variant={variant} size={size} disabled>
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={following ? 'outline' : variant}
      size={size}
      onClick={handleFollowToggle}
      disabled={loading}
      className="gap-2"
    >
      {following ? (
        <>
          <UserMinus className="h-4 w-4" />
          {loading ? 'Unfollowing...' : 'Unfollow'}
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          {loading ? 'Following...' : 'Follow'}
        </>
      )}
    </Button>
  );
}
