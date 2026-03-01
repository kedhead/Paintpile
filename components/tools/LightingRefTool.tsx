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

// --- Light presets ---
interface LightPreset {
  name: string;
  dir: [number, number, number];
}

const LIGHT_PRESETS: LightPreset[] = [
  { name: 'Zenithal', dir: [0, -1, 0.3] },
  { name: 'Below', dir: [0, 1, 0.3] },
  { name: 'Left', dir: [-1, 0, 0.3] },
  { name: 'Right', dir: [1, 0, 0.3] },
  { name: 'Front', dir: [0, 0, 1] },
  { name: 'Top-Left', dir: [-0.7, -0.7, 0.3] },
  { name: 'Top-Right', dir: [0.7, -0.7, 0.3] },
];

function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 1];
  return [v[0] / len, v[1] / len, v[2] / len];
}

// Heat color ramp: dark blue → blue → red → yellow → white
function heatColor(t: number): [number, number, number, number] {
  if (t <= 0.25) {
    const s = t / 0.25;
    return [0, 0, Math.round(40 + s * 140), 255];
  } else if (t <= 0.5) {
    const s = (t - 0.25) / 0.25;
    return [Math.round(s * 200), 0, Math.round(180 - s * 180), 255];
  } else if (t <= 0.75) {
    const s = (t - 0.5) / 0.25;
    return [Math.round(200 + s * 55), Math.round(s * 200), 0, 255];
  } else {
    const s = (t - 0.75) / 0.25;
    return [255, Math.round(200 + s * 55), Math.round(s * 255), 255];
  }
}

type ViewMode = 'heatmap' | 'depth' | 'original';

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
  const [depthMapUrl, setDepthMapUrl] = useState<string | null>(null);
  const [normalMapUrl, setNormalMapUrl] = useState<string | null>(null);
  const [normalData, setNormalData] = useState<Uint8ClampedArray | null>(null);
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [lightDir, setLightDir] = useState<[number, number, number]>(normalize(LIGHT_PRESETS[0].dir));
  const [activePreset, setActivePreset] = useState<string>('Zenithal');
  const [opacity, setOpacity] = useState(0.6);
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const [isDraggingPicker, setIsDraggingPicker] = useState(false);

  // Gallery picker state
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryProjects, setGalleryProjects] = useState<Project[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, Photo[]>>({});
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const depthImgRef = useRef<HTMLImageElement | null>(null);
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
      // Reset previous results
      setNormalData(null);
      setDepthMapUrl(null);
      setNormalMapUrl(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
  });

  // --- Analyze from URL (skip temp upload) ---
  const handleAnalyzeUrl = useCallback(async (sourceUrl: string) => {
    setIsProcessing(true);

    try {
      // Pre-load the original image for canvas compositing via proxy to avoid CORS
      const origImg = new Image();
      const origLoaded = new Promise<void>((resolve, reject) => {
        origImg.onload = () => { originalImgRef.current = origImg; resolve(); };
        origImg.onerror = () => reject(new Error('Failed to load image'));
      });
      origImg.src = `/api/proxy-image?url=${encodeURIComponent(sourceUrl)}`;

      // Set the URL as the preview image
      setImageDataUrl(sourceUrl);

      // Run API call and image load in parallel
      const [depthRes] = await Promise.all([
        fetch('/api/ai/depth-estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, sourceUrl }),
        }),
        origLoaded,
      ]);

      const depthData = await depthRes.json();
      if (!depthData.success || !depthData.data) {
        throw new Error(depthData.error || 'Depth estimation failed');
      }

      setDepthMapUrl(depthData.data.depthMapUrl);
      setNormalMapUrl(depthData.data.normalMapUrl);
      setImgWidth(depthData.data.width);
      setImgHeight(depthData.data.height);

      // Load normal map into pixel data
      await loadNormalMap(depthData.data.normalMapUrl, depthData.data.width, depthData.data.height);

      // Load depth map image for depth view
      const dImg = new Image();
      dImg.crossOrigin = 'anonymous';
      dImg.src = depthData.data.depthMapUrl;
      depthImgRef.current = dImg;

      toast.success(`Analyzed in ${(depthData.data.processingTime / 1000).toFixed(1)}s`);
    } catch (error: any) {
      console.error('[LightingRef] Analysis failed:', error);
      toast.error(error.message || 'Analysis failed');
      // Reset so the user can try again via dropzone or gallery
      setImageDataUrl(null);
    } finally {
      setIsProcessing(false);
    }
  }, [userId]);

  // --- Auto-trigger on mount when initialImageUrl is provided ---
  useEffect(() => {
    if (initialImageUrl && !initialUrlProcessed.current) {
      initialUrlProcessed.current = true;
      handleAnalyzeUrl(initialImageUrl);
    }
  }, [initialImageUrl, handleAnalyzeUrl]);

  // --- Analyze (upload + API call) ---
  const handleAnalyze = async () => {
    if (!imageFile) return;
    setIsProcessing(true);

    try {
      // Get auth token for authenticated upload
      const token = await currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Step 1: Upload to temp storage
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

      // Step 2: Call depth estimate API
      const depthRes = await fetch('/api/ai/depth-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sourceUrl: uploadData.url }),
      });

      const depthData = await depthRes.json();
      if (!depthData.success || !depthData.data) {
        throw new Error(depthData.error || 'Depth estimation failed');
      }

      setDepthMapUrl(depthData.data.depthMapUrl);
      setNormalMapUrl(depthData.data.normalMapUrl);
      setImgWidth(depthData.data.width);
      setImgHeight(depthData.data.height);

      // Step 3: Load normal map into pixel data
      await loadNormalMap(depthData.data.normalMapUrl, depthData.data.width, depthData.data.height);

      // Load depth map image for depth view
      const dImg = new Image();
      dImg.crossOrigin = 'anonymous';
      dImg.src = depthData.data.depthMapUrl;
      depthImgRef.current = dImg;

      toast.success(`Analyzed in ${(depthData.data.processingTime / 1000).toFixed(1)}s`);
    } catch (error: any) {
      console.error('[LightingRef] Analysis failed:', error);
      toast.error(error.message || 'Analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadNormalMap = async (url: string, w: number, h: number) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const ctx = offscreen.getContext('2d');
        if (!ctx) { reject(new Error('Could not get canvas context')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        setNormalData(data.data);
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load normal map'));
      img.src = url;
    });
  };

  // --- Load original image for canvas compositing (dropzone flow only) ---
  // For URL-based flow, originalImgRef is set in handleAnalyzeUrl via proxy
  useEffect(() => {
    if (!imageDataUrl) return;
    // Skip if already loaded by handleAnalyzeUrl (URL starts with /api/proxy won't be imageDataUrl)
    if (originalImgRef.current) return;
    const img = new Image();
    img.onload = () => { originalImgRef.current = img; };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  // --- Canvas rendering ---
  useEffect(() => {
    if (!canvasRef.current || !normalData || !originalImgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = imgWidth;
    const h = imgHeight;
    canvas.width = w;
    canvas.height = h;

    if (viewMode === 'original') {
      ctx.drawImage(originalImgRef.current, 0, 0, w, h);
      return;
    }

    if (viewMode === 'depth' && depthImgRef.current && depthImgRef.current.complete) {
      ctx.drawImage(depthImgRef.current, 0, 0, w, h);
      return;
    }

    // Heat map mode
    // Draw original as base
    ctx.drawImage(originalImgRef.current, 0, 0, w, h);

    // Compute heat map overlay
    const heatMap = ctx.createImageData(w, h);
    const [lx, ly, lz] = lightDir;

    for (let i = 0; i < w * h; i++) {
      const ni = i * 4; // normal data index (RGBA)
      const nx = (normalData[ni] / 255) * 2 - 1;
      const ny = (normalData[ni + 1] / 255) * 2 - 1;
      const nz = (normalData[ni + 2] / 255) * 2 - 1;

      const brightness = Math.max(0, nx * lx + ny * ly + nz * lz);
      const [r, g, b] = heatColor(brightness);

      const hi = i * 4;
      heatMap.data[hi] = r;
      heatMap.data[hi + 1] = g;
      heatMap.data[hi + 2] = b;
      heatMap.data[hi + 3] = 255;
    }

    // Composite heat map over original with opacity
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      offCtx.putImageData(heatMap, 0, 0);
      ctx.globalAlpha = opacity;
      ctx.drawImage(offscreen, 0, 0);
      ctx.globalAlpha = 1;
    }
  }, [normalData, lightDir, opacity, viewMode, imgWidth, imgHeight]);

  // --- Circular direction picker ---
  const pickerSize = 120;
  const pickerRadius = pickerSize / 2 - 8;

  const handlePickerInteraction = useCallback((e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const cx = (clientX - rect.left) / rect.width * pickerSize - pickerSize / 2;
    const cy = (clientY - rect.top) / rect.height * pickerSize - pickerSize / 2;

    // Clamp to circle
    const dist = Math.sqrt(cx * cx + cy * cy);
    const maxDist = pickerRadius;
    const scale = dist > maxDist ? maxDist / dist : 1;
    const px = cx * scale;
    const py = cy * scale;

    // Map picker position to light direction
    // px: left(-) to right(+), py: top(-) to bottom(+)
    const lx = px / maxDist;
    const ly = py / maxDist;
    const lz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly)) * 0.5 + 0.5;

    const newDir = normalize([lx, ly, lz] as [number, number, number]);
    setLightDir(newDir);
    setActivePreset('');
  }, [pickerRadius]);

  const handlePreset = (preset: LightPreset) => {
    setLightDir(normalize(preset.dir));
    setActivePreset(preset.name);
  };

  // --- Download ---
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'lighting-reference.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // --- Reset ---
  const handleReset = () => {
    setImageFile(null);
    setImageDataUrl(null);
    setNormalData(null);
    setDepthMapUrl(null);
    setNormalMapUrl(null);
    setLightDir(normalize(LIGHT_PRESETS[0].dir));
    setActivePreset('Zenithal');
    setOpacity(0.6);
    setViewMode('heatmap');
    originalImgRef.current = null;
    depthImgRef.current = null;
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
    handleAnalyzeUrl(photoUrl);
  };

  // Picker dot position from current lightDir
  const dotX = lightDir[0] * pickerRadius + pickerSize / 2;
  const dotY = lightDir[1] * pickerRadius + pickerSize / 2;

  const hasResults = !!normalData;

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
      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-foreground font-medium">Estimating depth and computing normals...</p>
          <p className="text-sm text-muted-foreground">This usually takes 5-10 seconds</p>
        </div>
      )}

      {/* Results */}
      {hasResults && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Canvas display */}
          <div className="space-y-3">
            <div className="rounded-lg overflow-hidden border border-border bg-black">
              <canvas
                ref={canvasRef}
                className="w-full h-auto"
                style={{ imageRendering: 'auto' }}
              />
            </div>

            {/* View toggle + Download */}
            <div className="flex flex-wrap items-center gap-2">
              {(['heatmap', 'depth', 'original'] as ViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={viewMode === mode ? 'default' : 'outline'}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === 'heatmap' ? 'Heat Map' : mode === 'depth' ? 'Depth Map' : 'Original'}
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

          {/* Controls panel */}
          <div className="space-y-6">
            {/* Light presets */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Light Direction</h3>
              <div className="grid grid-cols-2 gap-2">
                {LIGHT_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    size="sm"
                    variant={activePreset === preset.name ? 'default' : 'outline'}
                    onClick={() => handlePreset(preset)}
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Circular direction picker */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Custom Direction</h3>
              <div className="flex justify-center">
                <svg
                  width={pickerSize}
                  height={pickerSize}
                  viewBox={`0 0 ${pickerSize} ${pickerSize}`}
                  className="cursor-crosshair select-none"
                  onMouseDown={(e) => { setIsDraggingPicker(true); handlePickerInteraction(e); }}
                  onMouseMove={(e) => { if (isDraggingPicker) handlePickerInteraction(e); }}
                  onMouseUp={() => setIsDraggingPicker(false)}
                  onMouseLeave={() => setIsDraggingPicker(false)}
                  onTouchStart={(e) => { setIsDraggingPicker(true); handlePickerInteraction(e); }}
                  onTouchMove={(e) => { if (isDraggingPicker) handlePickerInteraction(e); }}
                  onTouchEnd={() => setIsDraggingPicker(false)}
                >
                  {/* Background circle */}
                  <circle
                    cx={pickerSize / 2}
                    cy={pickerSize / 2}
                    r={pickerRadius}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                  />
                  {/* Crosshairs */}
                  <line x1={pickerSize / 2} y1={pickerSize / 2 - pickerRadius} x2={pickerSize / 2} y2={pickerSize / 2 + pickerRadius} stroke="hsl(var(--border))" strokeWidth="1" />
                  <line x1={pickerSize / 2 - pickerRadius} y1={pickerSize / 2} x2={pickerSize / 2 + pickerRadius} y2={pickerSize / 2} stroke="hsl(var(--border))" strokeWidth="1" />
                  {/* Direction labels */}
                  <text x={pickerSize / 2} y="8" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">Top</text>
                  <text x={pickerSize / 2} y={pickerSize - 2} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">Below</text>
                  <text x="4" y={pickerSize / 2 + 3} textAnchor="start" fontSize="9" fill="hsl(var(--muted-foreground))">L</text>
                  <text x={pickerSize - 4} y={pickerSize / 2 + 3} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">R</text>
                  {/* Light position dot */}
                  <circle
                    cx={dotX}
                    cy={dotY}
                    r="6"
                    fill="hsl(var(--primary))"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* Opacity slider */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Overlay Opacity: {Math.round(opacity * 100)}%
              </h3>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* Legend */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Legend</h3>
              <div className="flex items-center gap-1 rounded overflow-hidden h-4">
                <div className="flex-1 h-full" style={{ background: 'linear-gradient(to right, rgb(0,0,40), rgb(0,0,180), rgb(200,0,0), rgb(255,200,0), rgb(255,255,255))' }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Shadow</span>
                <span>Highlight</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
