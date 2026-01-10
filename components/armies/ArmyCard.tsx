'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Army } from '@/types/army';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Image as ImageIcon, Users, Shield, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ArmyCardProps {
  army: Army;
  coverPhotoUrl?: string;
}

export function ArmyCard({ army, coverPhotoUrl }: ArmyCardProps) {
  const { currentUser } = useAuth();
  const timeAgo = army.updatedAt
    ? formatDistanceToNow(new Date(army.updatedAt.toDate()), { addSuffix: true })
    : null;

  return (
    <Link href={`/armies/${army.armyId}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="bg-card rounded-xl overflow-hidden border border-border shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-300 h-full flex flex-col group"
      >
        <div className="aspect-[4/3] overflow-hidden relative">
          {coverPhotoUrl || army.customPhotoUrl ? (
            <img
              src={coverPhotoUrl || army.customPhotoUrl}
              alt={army.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-indigo-500/20 flex items-center justify-center">
              <Shield className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          {army.faction && (
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-primary/90 text-primary-foreground backdrop-blur-sm border border-white/20">
                {army.faction}
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-2">
            <span className="px-2 py-1 text-xs font-medium rounded-md bg-black/60 text-white backdrop-blur-sm border border-white/20 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {army.projectIds.length} {army.projectIds.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors flex-1">
              {army.name}
            </h3>
          </div>

          {army.armySize && army.armySize > 0 && (
            <p className="text-sm text-muted-foreground mb-2">
              {army.armySize} {army.armySize === 1 ? 'model' : 'models'}
            </p>
          )}

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {army.description || 'No description'}
          </p>

          <div className="flex gap-2 flex-wrap mb-4">
            {army.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {/* TODO: Add LikeButton for armies in Phase 2 */}
              {army.commentCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{army.commentCount}</span>
                </div>
              )}
            </div>
            {timeAgo && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
