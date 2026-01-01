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
      <div className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-border/80 hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          <Image
            src={coverPhoto}
            alt={project.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {project.status === 'not-started' && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-md text-xs font-medium uppercase tracking-wide">
              {statusLabel}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and Subtitle */}
          <h3 className="font-display text-lg font-semibold mb-1 line-clamp-1">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-secondary/20 text-secondary-foreground text-xs rounded-md border border-secondary/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer - Paint chips and timestamp */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            {/* Paint chips placeholder - we'll populate this later */}
            <div className="flex items-center gap-1">
              {/* These will be actual paint chips from project paints */}
              <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-background" />
              <div className="w-5 h-5 rounded-full bg-amber-500 border-2 border-background -ml-2" />
            </div>

            {/* Timestamp */}
            {timeAgo && (
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
