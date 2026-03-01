'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, RotateCcw, Sun, Loader2, ImageIcon, X, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getUserProjects } from '@/lib/firestore/projects';
import { getProjectPhotos } from '@/lib/firestore/photos';
import { Project } from '@/types/project';
import { Photo } from '@/types/photo';

const DIRECTIONS = [
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' },
  { key: 'none', label: 'None' },
] as const;

type Direction = typeof DIRECTIONS[number]['key'];

interface LightingRefToolProps {
  userId: string;
  initialImageUrl?: string;
}

export function LightingRefTool({ userId, initialImageUrl }: LightingRefToolProps) {
  const { currentUser } = useAuth();

  // --- State ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [relightImages, setRelightImages] = useState<Record<string, string> | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>('top');

  // Gallery picker state
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryProjects, setGalleryProjects] = useState<Project[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, Photo[]>>({});
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const initialUrlProcessed = useRef(false);

  // --- Dropzone ---
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setImageFile(file);
      setRelightImages(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
  });

  // --- Relight from URL (gallery / initialImageUrl flow) ---
  const handleRelightUrl = useCallback(async (sourceUrl: string) => {
    setIsProcessing(true);
    setImageDataUrl(sourceUrl);

    try {
      const res = await fetch('/api/ai/relight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sourceUrl }),
      });

      const data = await res.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Relighting failed');
      }

      setRelightImages(data.data.images);
      setActiveDirection('top');
      toast.success(`Generated in ${(data.data.processingTime / 1000).toFixed(0)}s`);
    } catch (error: any) {
      console.error('[LightingRef] Relighting failed:', error);
      toast.error(error.message || 'Relighting failed');
      setImageDataUrl(null);
    } finally {
      setIsProcessing(false);
    }
  }, [userId]);

  // --- Auto-trigger on mount when initialImageUrl is provided ---
  useEffect(() => {
    if (initialImageUrl && !initialUrlProcessed.current) {
      initialUrlProcessed.current = true;
      handleRelightUrl(initialImageUrl);
    }
  }, [initialImageUrl, handleRelightUrl]);

  // --- Relight from uploaded file ---
  const handleAnalyze = async () => {
    if (!imageFile) return;
    setIsProcessing(true);

    try {
      const token = await currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Upload to temp storage
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('userId', userId);

      const uploadRes = await fetch('/api/upload/temp-image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success || !uploadData.url) {
        throw new Error(uploadData.error || 'Failed to upload image');
      }

      // Call relight API
      const res = await fetch('/api/ai/relight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sourceUrl: uploadData.url }),
      });

      const data = await res.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Relighting failed');
      }

      setRelightImages(data.data.images);
      setActiveDirection('top');
      toast.success(`Generated in ${(data.data.processingTime / 1000).toFixed(0)}s`);
    } catch (error: any) {
      console.error('[LightingRef] Relighting failed:', error);
      toast.error(error.message || 'Relighting failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Download ---
  const handleDownload = async () => {
    if (!relightImages || !relightImages[activeDirection]) return;

    try {
      const imageUrl = relightImages[activeDirection];
      // Fetch through proxy to avoid CORS
      const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxiedUrl);
      const blob = await response.blob();

      const link = document.createElement('a');
      link.download = `lighting-ref-${activeDirection}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error('Failed to download image');
    }
  };

  // --- Reset ---
  const handleReset = () => {
    setImageFile(null);
    setImageDataUrl(null);
    setRelightImages(null);
    setActiveDirection('top');
  };

  // --- Gallery picker ---
  const handleOpenGallery = async () => {
    setShowGalleryPicker(true);
    setIsLoadingGallery(true);
    try {
      const projects = await getUserProjects(userId);
      setGalleryProjects(projects.filter(p => p.photoCount > 0));
    } catch (error) {
      console.error('[LightingRef] Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleExpandProject = async (projectId: string) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
      return;
    }
    setExpandedProject(projectId);
    if (!galleryPhotos[projectId]) {
      try {
        const photos = await getProjectPhotos(projectId);
        setGalleryPhotos(prev => ({ ...prev, [projectId]: photos }));
      } catch (error) {
        console.error('[LightingRef] Failed to load photos:', error);
        toast.error('Failed to load photos');
      }
    }
  };

  const handleSelectGalleryPhoto = (photoUrl: string) => {
    setShowGalleryPicker(false);
    handleRelightUrl(photoUrl);
  };

  const hasResults = !!relightImages;
  const currentImageUrl = hasResults && relightImages[activeDirection]
    ? `/api/proxy-image?url=${encodeURIComponent(relightImages[activeDirection])}`
    : null;

  return (
    <div className="space-y-6">
      {/* Upload section */}
      {!hasResults && !isProcessing && (
        <div className="space-y-4">
          {!imageDataUrl ? (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground font-medium">
                  {isDragActive ? 'Drop your image here' : 'Drop a photo of your mini, or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  JPEG, PNG, or WebP — max 5MB
                </p>
              </div>

              <div className="flex justify-center">
                <Button variant="outline" onClick={handleOpenGallery}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Choose from Gallery
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted max-w-lg mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageDataUrl} alt="Preview" className="w-full h-auto" />
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Choose Different Image
                </Button>
                <Button onClick={handleAnalyze}>
                  <Sun className="w-4 h-4 mr-2" />
                  Generate Lighting
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gallery picker modal */}
      {showGalleryPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Choose from Gallery</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowGalleryPicker(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingGallery ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : galleryProjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No projects with photos found.</p>
              ) : (
                galleryProjects.map((project) => (
                  <div key={project.projectId} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleExpandProject(project.projectId)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      {project.coverPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.coverPhotoUrl}
                          alt=""
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.photoCount} photo{project.photoCount !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {expandedProject === project.projectId ? '▲' : '▼'}
                      </span>
                    </button>

                    {expandedProject === project.projectId && (
                      <div className="border-t border-border p-3">
                        {!galleryPhotos[project.projectId] ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          </div>
                        ) : galleryPhotos[project.projectId].length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No photos</p>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {galleryPhotos[project.projectId].map((photo) => (
                              <button
                                key={photo.photoId}
                                onClick={() => handleSelectGalleryPhoto(photo.url)}
                                className="aspect-square rounded overflow-hidden border border-border hover:border-primary hover:ring-2 hover:ring-primary/30 transition-all"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={photo.thumbnailUrl || photo.url}
                                  alt={photo.caption || 'Photo'}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing state */}
      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-foreground font-medium">Generating lighting references...</p>
          <p className="text-sm text-muted-foreground">This usually takes ~20 seconds</p>
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <div className="space-y-4">
          {/* Relit image display */}
          <div className="rounded-lg overflow-hidden border border-border bg-black">
            {currentImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImageUrl}
                alt={`${activeDirection} lighting`}
                className="w-full h-auto"
              />
            )}
          </div>

          {/* Direction buttons + actions */}
          <div className="flex flex-wrap items-center gap-2">
            {DIRECTIONS.map(({ key, label }) => (
              <Button
                key={key}
                size="sm"
                variant={activeDirection === key ? 'default' : 'outline'}
                onClick={() => setActiveDirection(key)}
              >
                {label}
              </Button>
            ))}
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              New Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
