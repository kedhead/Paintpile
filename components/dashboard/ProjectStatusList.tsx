'use client';

import { Project } from '@/types/project';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

interface ProjectStatusListProps {
    projects: Project[];
    status: 'not-started' | 'in-progress' | 'completed';
}

const statusLabels = {
    'not-started': 'Pile of Opportunity',
    'in-progress': 'Works in Progress',
    'completed': 'Completed Projects'
};

export function ProjectStatusList({ projects, status }: ProjectStatusListProps) {
    if (projects.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No projects in this category yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground sticky top-0 bg-background pb-2 border-b z-10">
                {statusLabels[status]} ({projects.length})
            </h3>
            <div className="space-y-3">
                {projects.map((project) => (
                    <Link
                        key={project.projectId}
                        href={`/projects/${project.projectId}`}
                        className="block group"
                    >
                        <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                        {project.name}
                                    </h4>
                                    {project.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                            {project.description}
                                        </p>
                                    )}
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                        Created: {project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                                {project.startDate && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            Started: {project.startDate.toDate ? project.startDate.toDate().toLocaleDateString() : 'Unknown'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
