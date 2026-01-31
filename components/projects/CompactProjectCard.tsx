'use client';

import Link from 'next/link';
import { Project } from '@/types/project';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Image as ImageIcon, CheckCircle, Circle, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface CompactProjectCardProps {
    project: Project;
    coverPhotoUrl?: string;
}

export function CompactProjectCard({ project, coverPhotoUrl }: CompactProjectCardProps) {
    const timeAgo = project.updatedAt
        ? formatDistanceToNow(new Date(project.updatedAt.toDate()), { addSuffix: true })
        : null;

    const StatusIcon = {
        'not-started': Circle,
        'in-progress': PlayCircle,
        'completed': CheckCircle,
    }[project.status] || Circle;

    const statusColor = {
        'not-started': 'text-muted-foreground',
        'in-progress': 'text-blue-500',
        'completed': 'text-green-500',
    }[project.status] || 'text-muted-foreground';

    return (
        <Link href={`/projects/${project.projectId}`}>
            <motion.div
                layoutId={project.projectId}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -2 }}
                className="bg-card rounded-lg border border-border hover:border-primary/50 transition-colors shadow-sm cursor-pointer group flex items-start gap-3 p-3 overflow-hidden"
            >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden relative border border-border/50">
                    {coverPhotoUrl ? (
                        <img
                            src={coverPhotoUrl}
                            alt={project.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {project.name}
                    </h4>

                    <div className="flex items-center gap-2 mt-1 mb-2">
                        <div className={cn("flex items-center gap-1 text-xs", statusColor)}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="capitalize">{project.status.replace('-', ' ')}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        {/* Tags (only show 1 to save space) */}
                        <div className="flex gap-1">
                            {project.tags?.[0] && (
                                <span className="bg-secondary/50 px-1.5 py-0.5 rounded border border-white/5 truncate max-w-[80px]">
                                    {project.tags[0]}
                                </span>
                            )}
                            {project.tags && project.tags.length > 1 && (
                                <span className="text-muted-foreground px-1">+{project.tags.length - 1}</span>
                            )}
                        </div>

                        {/* Time */}
                        {timeAgo && (
                            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
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
