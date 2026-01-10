'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types/project';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LikeButton } from '@/components/social/LikeButton';
import { Clock, Image as ImageIcon, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectCardProps {
  project: Project;
  coverPhotoUrl?: string;
}

export function ProjectCard({ project, coverPhotoUrl }: ProjectCardProps) {
  const { currentUser } = useAuth();
  const timeAgo = project.updatedAt
    ? formatDistanceToNow(new Date(project.updatedAt.toDate()), { addSuffix: true })
    : null;

  return (
    <Link href={`/projects/${project.projectId}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        className="bg-card rounded-xl overflow-hidden border border-border shadow-md hover:shadow-xl hover:border-primary/50 transition-all duration-300 h-full flex flex-col group"
      >
        <div className="aspect-[4/3] overflow-hidden relative">
          {coverPhotoUrl ? (
            <img
              src={coverPhotoUrl}
              alt={project.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted via-muted/50 to-muted flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-2">
            <StatusBadge status={project.status} />
          </div>
          {project.armyIds && project.armyIds.length > 0 && (
            <div className="absolute top-3 left-3">
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-purple-500/90 text-white backdrop-blur-sm border border-white/20 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {project.armyIds.length} {project.armyIds.length === 1 ? 'Army' : 'Armies'}
              </span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-display font-bold text-lg mb-1 group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
            {project.description || 'No description'}
          </p>

          <div className="flex gap-2 flex-wrap mb-4">
            {project.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentUser && (
                <LikeButton
                  userId={currentUser.uid}
                  projectId={project.projectId}
                  initialLikeCount={project.likeCount || 0}
                  size="sm"
                  showCount={true}
                />
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
