'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Project } from '@/types/project';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  // TODO: Get actual cover photo from project photos
  const coverPhoto = '/placeholder-project.jpg';
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
          <Image
            src={coverPhoto}
            alt={project.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 right-3">
            <StatusBadge status={project.status} />
          </div>
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
            <div className="flex -space-x-2">
              {/* Paint chips placeholder */}
              <div className="w-4 h-4 rounded-full bg-blue-500 border border-card shadow-sm" />
              <div className="w-4 h-4 rounded-full bg-amber-500 border border-card shadow-sm" />
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
