'use client';

import { useState } from 'react';
import { Project } from '@/types/project';
import { CompactProjectCard } from '@/components/projects/CompactProjectCard';
import { updateProject } from '@/lib/firestore/projects';
import { toast } from 'sonner';
import { MoreHorizontal, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanBoardProps {
    projects: Project[];
    coverPhotos: Record<string, string>;
    onProjectUpdated: () => void;
}

type ProjectStatus = 'not-started' | 'in-progress' | 'completed';

const COLUMNS: { id: ProjectStatus; label: string; color: string }[] = [
    { id: 'not-started', label: 'Planning', color: 'bg-muted/50' },
    { id: 'in-progress', label: 'In Progress', color: 'bg-blue-500/5' },
    { id: 'completed', label: 'Completed', color: 'bg-green-500/5' },
];

export function KanbanBoard({ projects, coverPhotos, onProjectUpdated }: KanbanBoardProps) {
    const [movingId, setMovingId] = useState<string | null>(null);

    const handleMove = async (project: Project, newStatus: ProjectStatus) => {
        if (project.status === newStatus) return;

        try {
            setMovingId(project.projectId);
            await updateProject(project.projectId, { status: newStatus });
            toast.success(`Moved to ${newStatus.replace('-', ' ')}`);
            onProjectUpdated();
        } catch (error) {
            console.error('Failed to move project', error);
            toast.error('Failed to update status');
        } finally {
            setMovingId(null);
        }
    };

    const getColumnProjects = (status: ProjectStatus) => {
        return projects.filter(p => p.status === status);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4 h-[calc(100vh-250px)] min-h-[500px]">
            {COLUMNS.map((column) => {
                const columnProjects = getColumnProjects(column.id);

                return (
                    <div
                        key={column.id}
                        className={`flex-1 min-w-[300px] flex flex-col rounded-xl border border-border/50 ${column.color}`}
                    >
                        {/* Column Header */}
                        <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-inherit rounded-t-xl z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <h3 className="font-medium text-foreground">{column.label}</h3>
                                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
                                    {columnProjects.length}
                                </span>
                            </div>
                        </div>

                        {/* Column Content */}
                        <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                            {columnProjects.map((project) => (
                                <div key={project.projectId} className="relative group/card">
                                    <CompactProjectCard
                                        project={project}
                                        coverPhotoUrl={coverPhotos[project.projectId]}
                                    />

                                    {/* Quick Actions Overlay (Mobile friendly via dropdown if needed, but hover for desktop) */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-background/80 backdrop-blur border border-border shadow-sm">
                                                    <MoreHorizontal className="w-3 h-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {column.id !== 'not-started' && (
                                                    <DropdownMenuItem onClick={() => handleMove(project, 'not-started')}>
                                                        <ArrowLeft className="mr-2 h-3 w-3" /> Move to Planning
                                                    </DropdownMenuItem>
                                                )}
                                                {column.id !== 'in-progress' && (
                                                    <DropdownMenuItem onClick={() => handleMove(project, 'in-progress')}>
                                                        {column.id === 'not-started' ? <ArrowRight className="mr-2 h-3 w-3" /> : <ArrowLeft className="mr-2 h-3 w-3" />}
                                                        Move to In Progress
                                                    </DropdownMenuItem>
                                                )}
                                                {column.id !== 'completed' && (
                                                    <DropdownMenuItem onClick={() => handleMove(project, 'completed')}>
                                                        <ArrowRight className="mr-2 h-3 w-3" /> Move to Completed
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}

                            {columnProjects.length === 0 && (
                                <div className="h-32 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
                                    Empty
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
