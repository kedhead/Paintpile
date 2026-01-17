'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getProject, deleteProject, updateProject } from '@/lib/firestore/projects';
import { getProjectPhotos, deletePhotoFromProject } from '@/lib/firestore/photos';
import { deletePhoto as deletePhotoStorage } from '@/lib/firebase/storage';
import { getUserProfile } from '@/lib/firestore/users';
import { getProjectArmies } from '@/lib/firestore/armies';
import { Project } from '@/types/project';
import { Photo } from '@/types/photo';
import { Paint } from '@/types/paint';
import { User } from '@/types/user';
import { Army } from '@/types/army';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PhotoUpload } from '@/components/photos/PhotoUpload';
import { PhotoGallery } from '@/components/photos/PhotoGallery';
import { ProjectPaintLibrary } from '@/components/paints/ProjectPaintLibrary';
import { ProjectRecipesList } from '@/components/recipes/ProjectRecipesList';
import { AddRecipeToProject } from '@/components/recipes/AddRecipeToProject';
import { ProjectTimeline } from '@/components/timeline/ProjectTimeline';
import { LikeButton } from '@/components/social/LikeButton';
import { FollowButton } from '@/components/social/FollowButton';
import { CommentList } from '@/components/comments/CommentList';
import { formatDate } from '@/lib/utils/formatters';
import { getPaintsByIds } from '@/lib/firestore/paints';
import { PaintChipList } from '@/components/paints/PaintChip';
import { ArrowLeft, Calendar, Tag, Palette, ChevronLeft, ChevronRight, Star, Edit2, X, Check, Shield } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { ShareButton } from '@/components/ui/ShareButton';

export default function ProjectDetailClient() {
    const params = useParams();
    const router = useRouter();
    const { currentUser } = useAuth();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [authorProfile, setAuthorProfile] = useState<User | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [armies, setArmies] = useState<Army[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPhotos, setLoadingPhotos] = useState(true);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [annotationPaints, setAnnotationPaints] = useState<Paint[]>([]);
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedStatus, setEditedStatus] = useState<'not-started' | 'in-progress' | 'completed'>('not-started');
    const [editedTags, setEditedTags] = useState<string[]>([]);
    const [showAddRecipe, setShowAddRecipe] = useState(false);
    const heroImageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        async function loadProject() {
            try {
                setLoading(true);
                const projectData = await getProject(projectId);

                if (!projectData) {
                    setError('Project not found');
                    return;
                }

                // Check if user has access to view this project
                if (projectData.userId !== currentUser?.uid && !projectData.isPublic) {
                    setError('You do not have permission to view this project');
                    return;
                }

                setProject(projectData);

                // Load author profile
                if (projectData.userId) {
                    try {
                        const author = await getUserProfile(projectData.userId);
                        setAuthorProfile(author);
                    } catch (err) {
                        console.error('Error loading author:', err);
                    }
                }
            } catch (err) {
                console.error('Error loading project:', err);
                setError('Failed to load project');
            } finally {
                setLoading(false);
            }
        }

        async function loadUserProfile() {
            if (currentUser?.uid) {
                try {
                    const profile = await getUserProfile(currentUser.uid);
                    setUserProfile(profile);
                } catch (err) {
                    console.error('Error loading user profile:', err);
                }
            }
        }

        async function loadArmies() {
            try {
                const projectArmies = await getProjectArmies(projectId, currentUser?.uid);
                setArmies(projectArmies);
            } catch (err) {
                console.error('Error loading armies:', err);
            }
        }

        if (currentUser) {
            loadProject();
            loadPhotos();
            loadUserProfile();
            loadArmies();
        }
    }, [projectId, currentUser]);

    // Update image size on window resize
    useEffect(() => {
        function handleResize() {
            updateHeroImageSize();
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    async function loadPhotos() {
        try {
            setLoadingPhotos(true);
            const projectPhotos = await getProjectPhotos(projectId);
            setPhotos(projectPhotos);
        } catch (err) {
            console.error('Error loading photos:', err);
        } finally {
            setLoadingPhotos(false);
        }
    }


    async function handleDelete() {
        if (!project || !currentUser) return;

        const confirmed = confirm('Are you sure you want to delete this project? This cannot be undone.');
        if (!confirmed) return;

        try {
            setIsDeleting(true);
            await deleteProject(project.projectId, currentUser.uid);
            router.push('/dashboard');
        } catch (err) {
            console.error('Error deleting project:', err);
            alert('Failed to delete project. Please try again.');
            setIsDeleting(false);
        }
    }

    async function togglePublic() {
        if (!project || !currentUser) return;

        try {
            const newIsPublic = !project.isPublic;
            await updateProject(project.projectId, { isPublic: newIsPublic });
            setProject({ ...project, isPublic: newIsPublic });
        } catch (err) {
            console.error('Error updating project:', err);
            alert('Failed to update project visibility');
        }
    }

    async function handleDeletePhoto(photoId: string) {
        if (!currentUser) return;

        try {
            await deletePhotoStorage(currentUser.uid, projectId, photoId);
            await deletePhotoFromProject(currentUser.uid, projectId, photoId);
            setPhotos((prev) => prev.filter((p) => p.photoId !== photoId));
        } catch (err) {
            console.error('Error deleting photo:', err);
            alert('Failed to delete photo');
        }
    }




    function updateHeroImageSize() {
        if (heroImageRef.current) {
            setImageSize({
                width: heroImageRef.current.clientWidth,
                height: heroImageRef.current.clientHeight,
            });
        }
    }

    function handlePreviousPhoto() {
        setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
        setSelectedAnnotationId(null);
        setAnnotationPaints([]);
    }

    function handleNextPhoto() {
        setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
        setSelectedAnnotationId(null);
        setAnnotationPaints([]);
    }

    async function handleSetFeaturedPhoto(photoId: string) {
        if (!project || !currentUser) return;

        try {
            await updateProject(project.projectId, { featuredPhotoId: photoId });
            setProject({ ...project, featuredPhotoId: photoId });
        } catch (err) {
            console.error('Error setting featured photo:', err);
            alert('Failed to set featured photo');
        }
    }

    async function handleAnnotationClick(annotationId: string, paintIds: string[]) {
        setSelectedAnnotationId(annotationId);
        if (paintIds.length > 0) {
            try {
                const paints = await getPaintsByIds(paintIds);
                setAnnotationPaints(paints);
            } catch (err) {
                console.error('Error loading annotation paints:', err);
            }
        } else {
            setAnnotationPaints([]);
        }
    }



    function handleStartEditProject() {
        if (!project) return;
        setEditedName(project.name);
        setEditedDescription(project.description || '');
        setEditedStatus(project.status);
        setEditedTags(project.tags || []);
        setIsEditingProject(true);
    }

    function handleCancelEditProject() {
        setIsEditingProject(false);
    }

    async function handleSaveProject() {
        if (!project || !currentUser) return;

        try {
            await updateProject(project.projectId, {
                name: editedName.trim(),
                description: editedDescription.trim() || undefined,
                status: editedStatus,
                tags: editedTags,
            });

            setProject({
                ...project,
                name: editedName.trim(),
                description: editedDescription.trim() || undefined,
                status: editedStatus,
                tags: editedTags,
            });

            setIsEditingProject(false);
        } catch (err) {
            console.error('Error updating project:', err);
            alert('Failed to update project');
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg font-medium text-muted-foreground mb-4">{error || 'Project not found'}</p>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const isOwner = project.userId === currentUser?.uid;
    // const coverPhoto = photos[0]?.url || '/placeholder-project.jpg'; // unused

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 pt-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/dashboard">
                        <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors cursor-pointer">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-display font-bold">Project Analysis</h1>
                        {authorProfile && (
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <span>by</span>
                                <Link href={`/users/${authorProfile.username}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                                    {authorProfile.photoURL ? (
                                        <img src={authorProfile.photoURL} alt={authorProfile.displayName} className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {authorProfile.displayName?.[0] || '?'}
                                        </div>
                                    )}
                                    <span className="font-medium">{authorProfile.displayName}</span>
                                </Link>
                                {currentUser && currentUser.uid !== authorProfile.userId && (
                                    <FollowButton
                                        currentUserId={currentUser.uid}
                                        targetUserId={authorProfile.userId}
                                        size="sm"
                                        variant="outline"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Image Area */}
                    <div className="lg:col-span-2">
                        <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden border border-border group">
                            {photos.length > 0 ? (
                                <>
                                    <div className="relative w-full h-full">
                                        <img
                                            ref={heroImageRef}
                                            src={photos[currentPhotoIndex].url}
                                            alt={photos[currentPhotoIndex].caption || project.name}
                                            className="w-full h-full object-cover"
                                            onLoad={updateHeroImageSize}
                                        />

                                        {/* Annotation Markers */}
                                        {photos[currentPhotoIndex].annotations && photos[currentPhotoIndex].annotations!.length > 0 && imageSize.width > 0 && (
                                            <>
                                                {photos[currentPhotoIndex].annotations!.map((annotation) => {
                                                    const pixelX = (annotation.x / 100) * imageSize.width;
                                                    const pixelY = (annotation.y / 100) * imageSize.height;

                                                    // Generate consistent color from annotation ID
                                                    const hash = annotation.id.split('').reduce((acc, char) => {
                                                        return char.charCodeAt(0) + ((acc << 5) - acc);
                                                    }, 0);
                                                    const hue = Math.abs(hash % 360);
                                                    const markerColor = `hsl(${hue}, 70%, 50%)`;
                                                    const isSelected = selectedAnnotationId === annotation.id;

                                                    return (
                                                        <button
                                                            key={annotation.id}
                                                            onClick={() => handleAnnotationClick(annotation.id, annotation.paints.map(p => p.paintId))}
                                                            className="absolute flex items-center gap-2 cursor-pointer hover:scale-110 transition-transform"
                                                            style={{
                                                                left: `${pixelX}px`,
                                                                top: `${pixelY}px`,
                                                                transform: 'translate(-50%, -50%)',
                                                            }}
                                                        >
                                                            {/* Marker Dot */}
                                                            <div
                                                                className={`w-6 h-6 rounded-full border-2 shadow-lg ${isSelected ? 'border-white scale-125' : 'border-white/80'
                                                                    }`}
                                                                style={{ backgroundColor: markerColor }}
                                                            />
                                                            {/* Label */}
                                                            {annotation.label && (
                                                                <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${isSelected ? 'bg-white text-gray-900' : 'bg-black/70 text-white'
                                                                    }`}>
                                                                    {annotation.label}
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </div>

                                    {/* Navigation Arrows */}
                                    {photos.length > 1 && (
                                        <>
                                            <button
                                                onClick={handlePreviousPhoto}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={handleNextPhoto}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </>
                                    )}

                                    {/* Photo Counter */}
                                    {photos.length > 1 && (
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                                            {currentPhotoIndex + 1} / {photos.length}
                                        </div>
                                    )}

                                    {/* Featured Photo Badge */}
                                    {project.featuredPhotoId === photos[currentPhotoIndex].photoId && (
                                        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            Featured
                                        </div>
                                    )}

                                    {/* Set Featured Button */}
                                    {isOwner && project.featuredPhotoId !== photos[currentPhotoIndex].photoId && (
                                        <button
                                            onClick={() => handleSetFeaturedPhoto(photos[currentPhotoIndex].photoId)}
                                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Star className="w-3 h-3" />
                                            Set as Featured
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <p className="text-muted-foreground mb-4">No photos yet</p>
                                        {isOwner && (
                                            <PhotoUpload
                                                userId={currentUser!.uid}
                                                projectId={projectId}
                                                onUploadComplete={loadPhotos}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Upload more photos button */}
                        {isOwner && photos.length > 0 && (
                            <div className="mt-4">
                                <PhotoUpload
                                    userId={currentUser!.uid}
                                    projectId={projectId}
                                    onUploadComplete={loadPhotos}
                                />
                            </div>
                        )}

                        {/* Selected Annotation Details */}
                        {selectedAnnotationId && photos.length > 0 && (() => {
                            const annotation = photos[currentPhotoIndex].annotations?.find(a => a.id === selectedAnnotationId);
                            if (!annotation) return null;

                            return (
                                <div className="mt-4 bg-card rounded-xl border border-border p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-semibold text-card-foreground">
                                            {annotation.label}
                                        </h4>
                                        <button
                                            onClick={() => setSelectedAnnotationId(null)}
                                            className="text-xs text-muted-foreground hover:text-card-foreground"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    {annotation.notes && (
                                        <p className="text-sm text-muted-foreground mb-3">{annotation.notes}</p>
                                    )}
                                    {annotationPaints.length > 0 && (
                                        <div>
                                            <p className="text-xs font-medium text-card-foreground mb-2">
                                                Paints ({annotationPaints.length}):
                                            </p>
                                            <PaintChipList paints={annotationPaints} size="sm" />
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Sidebar - Project Info */}
                    <div className="space-y-6">
                        <div className="bg-card rounded-xl border border-border shadow-xl p-6">
                            {isEditingProject ? (
                                /* Edit Mode */
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-card-foreground">Edit Project</h3>
                                        <button
                                            onClick={handleCancelEditProject}
                                            className="text-muted-foreground hover:text-card-foreground"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <Input
                                        label="Project Name"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        placeholder="Enter project name"
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-card-foreground mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            placeholder="Add a description"
                                            rows={3}
                                            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-card-foreground mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={editedStatus}
                                            onChange={(e) => setEditedStatus(e.target.value as any)}
                                            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="not-started">Not Started</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-card-foreground mb-1">
                                            Tags
                                        </label>
                                        <TagInput
                                            tags={editedTags}
                                            onChange={setEditedTags}
                                            placeholder="Add tags"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            variant="default"
                                            onClick={handleSaveProject}
                                            className="flex-1"
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Save
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleCancelEditProject}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <>
                                    <div className="flex items-center gap-3 mb-4">
                                        <StatusBadge status={project.status} />
                                        {project.isPublic && (
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Public</span>
                                        )}
                                        {isOwner && (
                                            <button
                                                onClick={handleStartEditProject}
                                                className="ml-auto text-muted-foreground hover:text-primary transition-colors"
                                                title="Edit project"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <h2 className="text-3xl font-display font-bold text-foreground mb-1">{project.name}</h2>
                                    <p className="text-lg text-muted-foreground mb-6">{project.description || 'No description'}</p>

                                    <div className="flex flex-col gap-3 py-4 border-y border-border">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>Created {formatDate(project.createdAt)}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground opacity-60 italic">
                                            Last updated {formatDate(project.updatedAt)}
                                        </div>
                                    </div>

                                    {project.tags && project.tags.length > 0 && (
                                        <div className="mt-6">
                                            <div className="flex gap-2 flex-wrap">
                                                {project.tags.map((tag) => (
                                                    <div
                                                        key={tag}
                                                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-border text-[10px] font-bold uppercase tracking-wider text-secondary-foreground"
                                                    >
                                                        <Tag className="w-3 h-3" />
                                                        {tag}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {armies && armies.length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                Part of {armies.length} {armies.length === 1 ? 'Army' : 'Armies'}
                                            </h4>
                                            <div className="space-y-2">
                                                {armies.map((army) => (
                                                    <Link key={army.armyId} href={`/armies/${army.armyId}`}>
                                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 hover:border-primary/50 transition-all cursor-pointer">
                                                            <Shield className="w-5 h-5 text-purple-500" />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm text-foreground">{army.name}</p>
                                                                {army.faction && (
                                                                    <p className="text-xs text-muted-foreground">{army.faction}</p>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {army.projectIds.length} {army.projectIds.length === 1 ? 'project' : 'projects'}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 space-y-2">
                                        {project.isPublic && currentUser && (
                                            <>
                                                <div className="flex items-center justify-center py-2">
                                                    <LikeButton
                                                        userId={currentUser.uid}
                                                        targetId={project.projectId}
                                                        type="project"
                                                        projectId={project.projectId}
                                                        initialLikeCount={project.likeCount || 0}
                                                        size="lg"
                                                        showCount={true}
                                                    />
                                                </div>
                                                <ShareButton
                                                    title={`Check out ${project.name} on PaintPile`}
                                                    text={`I'm working on ${project.name} on PaintPile!`}
                                                    className="w-full"
                                                />
                                            </>
                                        )}
                                        {isOwner && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={togglePublic}
                                                >
                                                    {project.isPublic ? 'Make Private' : 'Make Public'}
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    className="w-full"
                                                    onClick={handleDelete}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Deleting...' : 'Delete Project'}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="max-w-7xl mx-auto px-6 mt-12 relative z-20">
                <div className="bg-card rounded-xl border border-border shadow-xl p-6 md:p-8">
                    <Tabs defaultValue="log" className="w-full">
                        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-6 mb-6">
                            <TabsTrigger
                                value="log"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground px-0 py-2 text-muted-foreground transition-all text-base"
                            >
                                Progress Log
                            </TabsTrigger>
                            <TabsTrigger
                                value="colors"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground px-0 py-2 text-muted-foreground transition-all text-base"
                            >
                                Paints & Recipes
                            </TabsTrigger>
                        </TabsList>

                        {/* Progress Log Tab */}
                        <TabsContent value="log" className="mt-0">
                            <div className="space-y-8">
                                {/* Photo Gallery */}
                                {photos.length > 0 && (
                                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                                        <h3 className="text-xl font-display font-bold mb-6 text-foreground">
                                            Project Photos ({photos.length})
                                        </h3>
                                        <PhotoGallery
                                            photos={photos}
                                            projectId={projectId}
                                            userId={currentUser?.uid}
                                            onDelete={isOwner ? handleDeletePhoto : undefined}
                                            onPhotoUpdate={loadPhotos}
                                            canDelete={isOwner}
                                            canAnnotate={isOwner}
                                            isPro={
                                                (userProfile?.subscription?.tier === 'pro' &&
                                                    userProfile?.subscription?.status === 'active') ||
                                                userProfile?.features?.aiEnabled === true
                                            }
                                        />
                                    </div>
                                )}

                                {/* Timeline */}
                                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                                    <ProjectTimeline projectId={projectId} />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Paints & Recipes Tab */}
                        <TabsContent value="colors" className="mt-0">
                            <div className="space-y-8">
                                {/* Recipe Library Section */}
                                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl font-display font-bold flex items-center gap-2 text-foreground">
                                                <Palette className="w-5 h-5 text-primary" />
                                                Recipe Library
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Paint recipes linked to this project
                                            </p>
                                        </div>
                                        {isOwner && currentUser && (
                                            <Button size="sm" onClick={() => setShowAddRecipe(true)}>
                                                Add Recipe
                                            </Button>
                                        )}
                                    </div>

                                    {currentUser && (
                                        <ProjectRecipesList
                                            projectId={projectId}
                                            isOwner={isOwner}
                                        />
                                    )}
                                </div>

                                {/* Paint Library Section */}
                                {isOwner && (
                                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                                        <ProjectPaintLibrary projectId={projectId} userId={currentUser?.uid} />
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Comments Section */}
            {project.isPublic && (
                <div className="max-w-7xl mx-auto px-6 mt-12 pb-20">
                    <div className="bg-card rounded-xl border border-border shadow-xl p-6 md:p-8">
                        <CommentList
                            targetId={projectId}
                            type="project"
                            projectId={projectId}
                            currentUserId={currentUser?.uid}
                            currentUsername={currentUser?.displayName || undefined}
                            currentUserPhoto={currentUser?.photoURL || undefined}
                            isPublic={project.isPublic}
                        />
                    </div>
                </div>
            )}

            {/* Add Recipe Modal */}
            {showAddRecipe && currentUser && (
                <AddRecipeToProject
                    projectId={projectId}
                    userId={currentUser.uid}
                    onClose={() => setShowAddRecipe(false)}
                    onSuccess={() => {
                        // Recipe added successfully - ProjectRecipesList will auto-refresh
                    }}
                />
            )}
        </div>
    );
}
