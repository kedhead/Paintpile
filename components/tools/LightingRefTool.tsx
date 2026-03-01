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

// --- Light direction presets ---
const DIRECTION_PRESETS = [
  { key: 'zenithal', label: 'Zenithal', dir: [0, -1, 0.8] },
  { key: 'left', label: 'Left', dir: [-1, 0, 0.5] },
  { key: 'right', label: 'Right', dir: [1, 0, 0.5] },
  { key: 'below', label: 'Below', dir: [0, 1, 0.3] },
  { key: 'front', label: 'Front', dir: [0, 0, 1] },
  { key: 'top-left', label: 'Top-L', dir: [-0.7, -0.7, 0.5] },
  { key: 'top-right', label: 'Top-R', dir: [0.7, -0.7, 0.5] },
] as const;

type ViewMode = 'matcap' | 'depth' | 'original';

interface LightingRefToolProps {
  userId: string;
  initialImageUrl?: string;
}

function normalize3(v: number[]): number[] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 1];
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function LightingRefTool({ userId, initialImageUrl }: LightingRefToolProps) {
  const { currentUser } = useAuth();

  // --- State ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Depth analysis results
  const [normalMapUrl, setNormalMapUrl] = useState<string | null>(null);
  const [depthMapUrl, setDepthMapUrl] = useState<string | null>(null);
  const [normalData, setNormalData] = useState<ImageData | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [analysisWidth, setAnalysisWidth] = useState(0);
  const [analysisHeight, setAnalysisHeight] = useState(0);

  // Lighting controls
  const [lightDir, setLightDir] = useState<number[]>([0, -1, 0.8]); // zenithal default
  const [activePreset, setActivePreset] = useState<string>('zenithal');
  const [opacity, setOpacity] = useState(60);
  const [viewMode, setViewMode] = useState<ViewMode>('matcap');

  // The source URL used for depth estimation (Firebase URL)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  // Gallery picker state
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryProjects, setGalleryProjects] = useState<Project[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, Photo[]>>({});
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Circular picker drag state
  const circleRef = useRef<HTMLDivElement>(null);
  const [isDraggingCircle, setIsDraggingCircle] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      resetAnalysis();
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
  });

  function resetAnalysis() {
    setNormalMapUrl(null);
    setDepthMapUrl(null);
    setNormalData(null);
    setOriginalImage(null);
    setSourceUrl(null);
    setActivePreset('zenithal');
    setLightDir([0, -1, 0.8]);
    setViewMode('matcap');
  }

  // --- Load normal map pixels into ImageData for client-side lighting ---
  const loadNormalMapData = useCallback(async (url: string, w: number, h: number) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise<ImageData>((resolve, reject) => {
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const ctx = offscreen.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(ctx.getImageData(0, 0, w, h));
      };
      img.onerror = () => reject(new Error('Failed to load normal map'));
      img.src = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    });
  }, []);

  // --- Load original image for compositing ---
  const loadOriginalImage = useCallback(async (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load original image'));
      // If it's a data URL use directly, otherwise proxy
      img.src = url.startsWith('data:') ? url : `/api/proxy-image?url=${encodeURIComponent(url)}`;
    });
  }, []);

  // --- Run depth estimation ---
  const runDepthEstimation = useCallback(async (srcUrl: string, displayUrl: string) => {
    setIsProcessing(true);

    try {
      const res = await fetch('/api/ai/depth-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sourceUrl: srcUrl }),
      });

      const data = await res.json();
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Depth estimation failed');
      }

      const { depthMapUrl: dUrl, normalMapUrl: nUrl, width, height, processingTime } = data.data;

      setDepthMapUrl(dUrl);
      setNormalMapUrl(nUrl);
      setAnalysisWidth(width);
      setAnalysisHeight(height);

      // Load normal map pixels and original image in parallel
      const [nData, origImg] = await Promise.all([
        loadNormalMapData(nUrl, width, height),
        loadOriginalImage(displayUrl),
      ]);

      setNormalData(nData);
      setOriginalImage(origImg);
      toast.success(`Depth analysis complete in ${(processingTime / 1000).toFixed(0)}s`);
    } catch (error: any) {
      console.error('[LightingRef] Depth estimation failed:', error);
      toast.error(error.message || 'Depth estimation failed');
    } finally {
      setIsProcessing(false);
    }
  }, [userId, loadNormalMapData, loadOriginalImage]);

  // --- Handle URL-based source (gallery pick / initialImageUrl) ---
  const handleSourceUrl = useCallback(async (url: string) => {
    setImageDataUrl(url);
    setSourceUrl(url);
    resetAnalysis();
    setSourceUrl(url);
    setImageDataUrl(url);
    await runDepthEstimation(url, url);
  }, [runDepthEstimation]);

  // --- Auto-trigger on mount when initialImageUrl is provided ---
  useEffect(() => {
    if (initialImageUrl && !initialUrlProcessed.current) {
      initialUrlProcessed.current = true;
      handleSourceUrl(initialImageUrl);
    }
  }, [initialImageUrl, handleSourceUrl]);

  // --- Upload file then run depth estimation ---
  const handleAnalyze = async () => {
    if (!imageFile || !imageDataUrl) return;
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

      setSourceUrl(uploadData.url);
      await runDepthEstimation(uploadData.url, imageDataUrl);
    } catch (error: any) {
      console.error('[LightingRef] Analysis failed:', error);
      toast.error(error.message || 'Analysis failed');
      setIsProcessing(false);
    }
  };

  // --- Render matcap shading onto canvas ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !normalData || !originalImage || analysisWidth === 0) return;

    canvas.width = analysisWidth;
    canvas.height = analysisHeight;
    const ctx = canvas.getContext('2d')!;

    if (viewMode === 'original') {
      ctx.drawImage(originalImage, 0, 0, analysisWidth, analysisHeight);
      return;
    }

    if (viewMode === 'depth' && depthMapUrl) {
      // Draw depth map — loaded via an image
      const depthImg = new Image();
      depthImg.crossOrigin = 'anonymous';
      depthImg.onload = () => ctx.drawImage(depthImg, 0, 0, analysisWidth, analysisHeight);
      depthImg.src = `/api/proxy-image?url=${encodeURIComponent(depthMapUrl)}`;
      return;
    }

    // Matcap shading mode
    const light = normalize3(lightDir);
    const pixels = normalData.data;
    const w = analysisWidth;
    const h = analysisHeight;

    // Draw original first
    ctx.drawImage(originalImage, 0, 0, w, h);
    const origPixels = ctx.getImageData(0, 0, w, h);
    const origData = origPixels.data;

    // Compute matcap overlay
    const output = ctx.createImageData(w, h);
    const out = output.data;
    const alpha = opacity / 100;

    for (let i = 0; i < w * h; i++) {
      const pi = i * 4;

      // Decode normal from RGB [0,255] → [-1,1]
      const nx = (pixels[pi] / 255) * 2 - 1;
      const ny = (pixels[pi + 1] / 255) * 2 - 1;
      const nz = (pixels[pi + 2] / 255) * 2 - 1;

      // Dot product for lambertian shading
      const dot = nx * light[0] + ny * light[1] + nz * light[2];
      const brightness = Math.max(0, dot);

      // Map to grayscale shading value (0=shadow, 255=highlight)
      const shade = Math.round(brightness * 255);

      // Blend: original * (1 - alpha) + shade * alpha
      out[pi] = Math.round(origData[pi] * (1 - alpha) + shade * alpha);
      out[pi + 1] = Math.round(origData[pi + 1] * (1 - alpha) + shade * alpha);
      out[pi + 2] = Math.round(origData[pi + 2] * (1 - alpha) + shade * alpha);
      out[pi + 3] = 255;
    }

    ctx.putImageData(output, 0, 0);
  }, [normalData, originalImage, lightDir, opacity, viewMode, analysisWidth, analysisHeight, depthMapUrl]);

  // --- Circular direction picker ---
  const handleCircleInteraction = useCallback((clientX: number, clientY: number) => {
    const circle = circleRef.current;
    if (!circle) return;

    const rect = circle.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const radius = rect.width / 2;

    const dx = (clientX - cx) / radius;
    const dy = (clientY - cy) / radius;

    // Clamp to unit circle
    const len = Math.sqrt(dx * dx + dy * dy);
    const clampedX = len > 1 ? dx / len : dx;
    const clampedY = len > 1 ? dy / len : dy;

    // Z component decreases as we move away from center
    const z = Math.sqrt(Math.max(0, 1 - clampedX * clampedX - clampedY * clampedY));

    setLightDir([clampedX, clampedY, z + 0.2]);
    setActivePreset('');
  }, []);

  const handleCircleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDraggingCircle(true);
    handleCircleInteraction(e.clientX, e.clientY);
  }, [handleCircleInteraction]);

  useEffect(() => {
    if (!isDraggingCircle) return;

    const handleMove = (e: MouseEvent) => {
      e.preventDefault();
      handleCircleInteraction(e.clientX, e.clientY);
    };
    const handleUp = () => setIsDraggingCircle(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingCircle, handleCircleInteraction]);

  // Touch support for circular picker
  const handleCircleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDraggingCircle(true);
    const touch = e.touches[0];
    handleCircleInteraction(touch.clientX, touch.clientY);
  }, [handleCircleInteraction]);

  useEffect(() => {
    if (!isDraggingCircle) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleCircleInteraction(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = () => setIsDraggingCircle(false);

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingCircle, handleCircleInteraction]);

  // --- Preset click ---
  const handlePresetClick = (key: string, dir: readonly number[]) => {
    setLightDir([...dir]);
    setActivePreset(key);
  };

  // --- Download ---
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `lighting-ref-${activePreset || 'custom'}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  };

  // --- Reset ---
  const handleReset = () => {
    setImageFile(null);
    setImageDataUrl(null);
    resetAnalysis();
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
    handleSourceUrl(photoUrl);
  };

  const hasResults = normalData !== null && originalImage !== null;
  const showUpload = !hasResults && !isProcessing && !sourceUrl;

  // Compute indicator position for circular picker
  const normLight = normalize3(lightDir);
  const indicatorX = normLight[0] * 0.8; // 80% of radius
  const indicatorY = normLight[1] * 0.8;

  return (
    <div className="space-y-6">
      {/* Upload section */}
      {showUpload && (
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
                  Analyze Lighting
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
      {isProcessing && !hasResults && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-foreground font-medium">Analyzing depth...</p>
          <p className="text-sm text-muted-foreground">This may take up to 60 seconds on first run</p>
        </div>
      )}

      {/* Results — canvas + controls */}
      {hasResults && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Canvas */}
            <div className="flex-1 min-w-0">
              <div className="rounded-lg overflow-hidden border border-border bg-black">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto"
                  style={{ display: 'block' }}
                />
              </div>
            </div>

            {/* Controls sidebar */}
            <div className="lg:w-56 space-y-4 flex-shrink-0">
              {/* Direction presets */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Light Direction</p>
                <div className="flex flex-wrap gap-1.5">
                  {DIRECTION_PRESETS.map(({ key, label, dir }) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={activePreset === key ? 'default' : 'outline'}
                      onClick={() => handlePresetClick(key, dir)}
                      className="text-xs px-2 py-1 h-7"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Circular picker */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Custom Direction</p>
                <div
                  ref={circleRef}
                  className="w-28 h-28 mx-auto rounded-full border-2 border-border bg-muted/30 relative cursor-crosshair select-none"
                  onMouseDown={handleCircleMouseDown}
                  onTouchStart={handleCircleTouchStart}
                >
                  {/* Crosshair lines */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-px bg-border" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-full w-px bg-border" />
                  </div>
                  {/* Light direction indicator */}
                  <div
                    className="absolute w-4 h-4 rounded-full bg-yellow-400 border-2 border-white shadow-md pointer-events-none"
                    style={{
                      left: `calc(50% + ${indicatorX * 50}% - 8px)`,
                      top: `calc(50% + ${indicatorY * 50}% - 8px)`,
                    }}
                  />
                </div>
              </div>

              {/* Opacity slider */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Overlay Opacity: {opacity}%
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Bottom bar: view modes + actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View mode toggles */}
            {(['matcap', 'depth', 'original'] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={viewMode === mode ? 'default' : 'outline'}
                onClick={() => setViewMode(mode)}
              >
                {mode === 'matcap' ? 'Lighting' : mode === 'depth' ? 'Depth Map' : 'Original'}
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

          <p className="text-xs text-muted-foreground">
            Click direction presets or drag the circle to change light angle. Adjust opacity to blend with your photo.
          </p>
        </div>
      )}
    </div>
  );
}
