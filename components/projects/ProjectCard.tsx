'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Project } from '@/types/project';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  // TODO: Get actual cover photo from project photos
  const coverPhoto = '/placeholder-project.jpg';
  const timeAgo = project.updatedAt
    ? formatDistanceToNow(new Date(project.updatedAt.toDate()), { addSuffix: true })
    : null;

  const statusStyles = {
    'not-started': 'bg-secondary/20 text-secondary-foreground border-secondary/30',
    'in-progress': 'bg-primary/20 text-primary border-primary/30',
    completed: 'bg-success-500/20 text-success-500 border-success-500/30',
  };

  const statusLabels = {
    'not-started': 'Planning',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };

  const statusBadge = statusStyles[project.status as keyof typeof statusStyles] || statusStyles['not-started'];
  const statusLabel = statusLabels[project.status as keyof typeof statusLabels] || 'Planning';

  return (
    <Link href={`/projects/${project.projectId}`}>
      <div className="group relative rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-border/80 hover:shadow-lg">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <Image
            src={coverPhoto}
            alt={project.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {project.status === 'not-started' && (
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded text-[10px] font-medium uppercase tracking-wide">
              {statusLabel}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-display text-base font-semibold mb-1 line-clamp-1">
            {project.name}
          </h3>

          {/* Subtitle */}
          {project.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
              {project.description}
            </p>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {project.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 bg-secondary/20 text-secondary-foreground text-[10px] rounded border border-secondary/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer - Paint chips and timestamp */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {/* Paint chips placeholder */}
            <div className="flex items-center -space-x-1">
              <div className="w-4 h-4 rounded-full bg-blue-500 border border-background" />
              <div className="w-4 h-4 rounded-full bg-amber-500 border border-background" />
            </div>

            {/* Timestamp */}
            {timeAgo && (
              <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
