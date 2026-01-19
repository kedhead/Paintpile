'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/types/project';
import { getUserProjects } from '@/lib/firestore/projects';
import { submitEntry, getUserSubmission } from '@/lib/firestore/challenges';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SubmitEntryDialogProps {
    challengeId: string;
    onSuccess: () => void;
    children?: React.ReactNode;
}

export function SubmitEntryDialog({ challengeId, onSuccess, children }: SubmitEntryDialogProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);

    useEffect(() => {
        if (!open || !user) return;

        async function loadData() {
            setLoading(true);
            try {
                // Check if already submitted
                const existing = await getUserSubmission(challengeId, user!.uid);
                if (existing) {
                    setAlreadySubmitted(true);
                    setLoading(false);
                    return;
                }

                // Fetch public projects
                const userProjects = await getUserProjects(user!.uid);
                // Filter for public only
                const publicProjects = userProjects.filter(p => p.isPublic);
                setProjects(publicProjects);

            } catch (err) {
                console.error("Error loading projects:", err);
                toast.error("Failed to load your projects");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [open, user, challengeId]);

    const handleSubmit = async () => {
        if (!selectedProjectId || !user) return;

        setSubmitting(true);
        try {
            await submitEntry(user.uid, challengeId, selectedProjectId);
            toast.success("Project submitted successfully!");
            setOpen(false);
            onSuccess();
        } catch (err: any) {
            console.error("Submission failed:", err);
            toast.error(err.message || "Failed to submit entry");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
                {children || <Button>Enter Challenge</Button>}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select a Project</DialogTitle>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : alreadySubmitted ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                            <p>You have already entered this challenge!</p>
                            <h3 className="text-sm font-medium mb-3">Select a Project to Submit:</h3>
                            <div className="h-[300px] overflow-y-auto pr-2 border rounded-md p-2">
                                {projects.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground opacity-70">
                                        <p>No eligible projects found.</p>
                                        <p className="text-xs mt-1">Make sure you have a <strong>Public</strong> project to enter.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {projects.map(project => (
                                            <div
                                                key={project.projectId}
                                                onClick={() => setSelectedProjectId(project.projectId)}
                                                className={`
                                            flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all
                                            ${selectedProjectId === project.projectId
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-transparent hover:bg-muted'
                                                    }
                                        `}
                                            >
                                                <div className="h-12 w-12 bg-muted rounded overflow-hidden flex-shrink-0">
                                                    {project.coverPhotoUrl && (
                                                        <img src={project.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                                                    )}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-medium truncate">{project.name}</p>
                                                    <p className="text-xs text-muted-foreground">{project.status}</p>
                                                </div>
                                                {selectedProjectId === project.projectId && (
                                                    <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[300px] overflow-y-auto pr-4">
                            {projects.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground opacity-70">
                                    <p>No eligible projects found.</p>
                                    <p className="text-xs mt-1">Make sure you have a <strong>Public</strong> project to enter.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {projects.map(project => (
                                        <div
                                            key={project.projectId}
                                            onClick={() => setSelectedProjectId(project.projectId)}
                                            className={`
                                            flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all
                                            ${selectedProjectId === project.projectId
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-transparent hover:bg-muted'
                                                }
                                        `}
                                        >
                                            <div className="h-12 w-12 bg-muted rounded overflow-hidden flex-shrink-0">
                                                {project.coverPhotoUrl && (
                                                    <img src={project.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-medium truncate">{project.name}</p>
                                                <p className="text-xs text-muted-foreground">{project.status}</p>
                                            </div>
                                            {selectedProjectId === project.projectId && (
                                                <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        {!alreadySubmitted && (
                            <Button
                                onClick={handleSubmit}
                                disabled={!selectedProjectId || submitting || projects.length === 0}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Entry
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
