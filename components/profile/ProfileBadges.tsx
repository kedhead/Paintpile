'use client';

import { useState, useEffect } from 'react';
import { getUserBadges } from '@/lib/firestore/badges';
import { UserBadge, BADGE_DEFINITIONS, BadgeDefinition } from '@/types/badge';
import { formatDistanceToNow } from 'date-fns';
import { Award } from 'lucide-react';

interface ProfileBadgesProps {
  userId: string;
  isOwnProfile?: boolean;
}

export function ProfileBadges({ userId, isOwnProfile = false }: ProfileBadgesProps) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBadges() {
      try {
        setLoading(true);
        const userBadges = await getUserBadges(userId);
        setBadges(userBadges);
      } catch (err) {
        console.error('Error loading badges:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBadges();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Loading badges...</p>
      </div>
    );
  }

  if (badges.length === 0) {
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

  return (
    <div className="space-y-6">
      {/* Badge Count */}
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          {badges.length} {badges.length === 1 ? 'Badge' : 'Badges'} Earned
        </h3>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {badges.map((badge) => {
          const definition = BADGE_DEFINITIONS[badge.badgeType];
          return (
            <BadgeCard
              key={badge.badgeId}
              badge={badge}
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
  definition: BadgeDefinition;
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
    switch (definition.tier) {
      case 'legendary':
        return (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-gradient-to-r from-purple-500 to-pink-600 text-white uppercase tracking-wide">
            Legendary
          </span>
        );
      case 'platinum':
        return (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-500 text-white uppercase tracking-wide">
            Platinum
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative p-4 rounded-lg bg-gradient-to-br ${getTierColor()} border backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer group`}
      title={`${definition.name} - ${definition.description}\nEarned ${timeAgo}`}
    >
      {getTierBadge()}

      {/* Badge Icon */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${definition.color}20` }}
        >
          {definition.icon}
        </div>

        {/* Badge Name */}
        <h4 className="text-sm font-bold text-foreground line-clamp-2">
          {definition.name}
        </h4>

        {/* Badge Description - shows on hover */}
        <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute inset-x-2 bottom-2 bg-background/90 backdrop-blur-sm p-2 rounded border border-border">
          {definition.description}
        </p>
      </div>

      {/* Earned Date - subtle */}
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        {timeAgo}
      </p>
    </div>
  );
}
