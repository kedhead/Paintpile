'use client';

import { useState, useEffect } from 'react';
import { getUserBadges, getAllBadges } from '@/lib/firestore/badges';
import { UserBadge, Badge } from '@/types/badge';
import { formatDistanceToNow } from 'date-fns';
import { Award, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileBadgesProps {
  userId: string;
  isOwnProfile?: boolean;
}

export function ProfileBadges({ userId, isOwnProfile = false }: ProfileBadgesProps) {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [earned, definitions] = await Promise.all([
          getUserBadges(userId),
          getAllBadges() // Fetch definitions so we know details about earned badges
        ]);
        setUserBadges(earned);
        setAllBadges(definitions);
      } catch (err) {
        console.error('Error loading badges:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Loading badges...</p>
      </div>
    );
  }

  if (userBadges.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Award className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {isOwnProfile
            ? 'No badges earned yet. Keep creating and engaging to earn badges!'
            : 'No badges earned yet'}
        </p>
      </div>
    );
  }

  // Calculate total points
  const totalPoints = userBadges.reduce((sum, ub) => {
    const badge = allBadges.find(b => b.id === ub.badgeId);
    return sum + (badge?.points || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Badge Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            {userBadges.length} {userBadges.length === 1 ? 'Badge' : 'Badges'} Earned
          </h3>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {totalPoints} Points
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {userBadges.map((userBadge) => {
          const definition = allBadges.find(b => b.id === userBadge.badgeId);

          // Skip if definition not found (deleted badge?)
          if (!definition) return null;

          return (
            <BadgeCard
              key={userBadge.badgeId}
              badge={userBadge}
              definition={definition}
            />
          );
        })}
      </div>
    </div>
  );
}

interface BadgeCardProps {
  badge: UserBadge;
  definition: Badge;
}

function BadgeCard({ badge, definition }: BadgeCardProps) {
  const timeAgo = badge.earnedAt
    ? formatDistanceToNow(badge.earnedAt.toDate(), { addSuffix: true })
    : '';

  // Get tier color
  const getTierColor = () => {
    switch (definition.tier) {
      case 'bronze':
        return 'from-amber-700/20 to-amber-900/20 border-amber-700/30';
      case 'silver':
        return 'from-gray-400/20 to-gray-600/20 border-gray-400/30';
      case 'gold':
        return 'from-yellow-500/20 to-yellow-700/20 border-yellow-500/30';
      case 'platinum':
        return 'from-slate-400/20 to-slate-600/20 border-slate-400/30';
      case 'legendary':
        return 'from-purple-500/20 to-pink-600/20 border-purple-500/30';
      default:
        return 'from-gray-400/20 to-gray-600/20 border-gray-400/30';
    }
  };

  // Get tier badge
  const getTierBadge = () => {
    if (['legendary', 'platinum'].includes(definition.tier)) {
      return (
        <span className={cn(
          "absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded text-white uppercase tracking-wide",
          definition.tier === 'legendary' ? "bg-gradient-to-r from-purple-500 to-pink-600" : "bg-slate-500"
        )}>
          {definition.tier}
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={`relative p-4 rounded-lg bg-gradient-to-br ${getTierColor()} border backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer group flex flex-col items-center text-center`}
      title={`${definition.name} - ${definition.description}\nEarned ${timeAgo}`}
    >
      {getTierBadge()}

      {/* Badge Icon */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 shadow-inner"
        style={{
          backgroundColor: `${definition.color}20`,
          borderColor: definition.color
        }}
      >
        {definition.icon || <Award />}
      </div>

      {/* Badge Name */}
      <h4 className="text-sm font-bold text-foreground line-clamp-1 mb-1">
        {definition.name}
      </h4>

      {/* Badge Description - shows on hover */}
      <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute inset-x-2 bottom-2 bg-background/95 backdrop-blur-sm p-2 rounded border border-border z-10 shadow-lg">
        {definition.description}
      </p>

      {/* Earned Date - subtle */}
      <p className="text-[10px] text-muted-foreground mt-auto">
        {timeAgo}
      </p>
    </div>
  );
}
