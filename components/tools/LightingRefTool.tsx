'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, RotateCcw, Sun, Loader2, ImageIcon, X, FolderOpen, Plus, Trash2, Circle, Flashlight, Minus, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getUserProjects } from '@/lib/firestore/projects';
import { getProjectPhotos } from '@/lib/firestore/photos';
import { Project } from '@/types/project';
import { Photo } from '@/types/photo';

// --- Light model ---
type LightShape = 'radial' | 'spot' | 'line';

interface Light {
  id: string;
  shape: LightShape;
  x: number;        // 0-1 normalized position on image
  y: number;        // 0-1 normalized position on image
  z: number;        // height above surface (controls angle)
  dz: number;       // depth position: 0 = behind model, 0.5 = middle, 1 = in front
  tx: number;       // target/endpoint x (spot: aim target, line: second endpoint)
  ty: number;       // target/endpoint y
  color: string;    // hex color
  intensity: number; // 0-2 range
  radius: number;   // falloff radius in normalized coords
  enabled: boolean;
  coneAngle: number;  // spot only — half-angle in degrees (15-60)
  softness: number;   // spot only — edge softness (0-1)
}

function createDefaultLights(): Light[] {
  return [
    {
      id: 'light-1',
      shape: 'radial',
      x: 0.3, y: 0.25, z: 0.6, dz: 0.5,
      tx: 0.5, ty: 0.5,
      color: '#fff5e0',
      intensity: 1.2,
      radius: 0.5,
      enabled: true,
      coneAngle: 30,
      softness: 0.5,
    },
    {
      id: 'light-2',
      shape: 'radial',
      x: 0.7, y: 0.75, z: 0.4, dz: 0.5,
      tx: 0.5, ty: 0.5,
      color: '#e0e8ff',
      intensity: 0.8,
      radius: 0.6,
      enabled: true,
      coneAngle: 30,
      softness: 0.5,
    },
  ];
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

let lightIdCounter = 3;

type ViewMode = 'matcap' | 'depth' | 'original';

interface LightingRefToolProps {
  userId: string;
  initialImageUrl?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
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
  const [depthData, setDepthData] = useState<ImageData | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [analysisWidth, setAnalysisWidth] = useState(0);
  const [analysisHeight, setAnalysisHeight] = useState(0);

  // Multi-light controls
  const [lights, setLights] = useState<Light[]>(createDefaultLights);
  const [selectedLightId, setSelectedLightId] = useState<string | null>('light-1');
  const [ambientIntensity, setAmbientIntensity] = useState(15);
  const [opacity, setOpacity] = useState(60);
  const [depthInfluence, setDepthInfluence] = useState(0);
  const [showHandles, setShowHandles] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('matcap');

  // The source URL used for depth estimation (Firebase URL)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  // Gallery picker state
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryProjects, setGalleryProjects] = useState<Project[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<Record<string, Photo[]>>({});
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  // Light dragging state
  const [draggingLightId, setDraggingLightId] = useState<string | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<'position' | 'target'>('position');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

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
    setDepthData(null);
    setOriginalImage(null);
    setSourceUrl(null);
    setLights(createDefaultLights());
    setSelectedLightId('light-1');
    setAmbientIntensity(15);
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

      // Load normal map, depth map, and original image in parallel
      const [nData, dData, origImg] = await Promise.all([
        loadNormalMapData(nUrl, width, height),
        loadNormalMapData(dUrl, width, height),
        loadOriginalImage(displayUrl),
      ]);

      setNormalData(nData);
      setDepthData(dData);
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

  // --- Render multi-light shading onto canvas ---
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
      const depthImg = new Image();
      depthImg.crossOrigin = 'anonymous';
      depthImg.onload = () => ctx.drawImage(depthImg, 0, 0, analysisWidth, analysisHeight);
      depthImg.src = `/api/proxy-image?url=${encodeURIComponent(depthMapUrl)}`;
      return;
    }

    // Multi-light point lighting
    const pixels = normalData.data;
    const depthPixels = depthData?.data ?? null;
    const w = analysisWidth;
    const h = analysisHeight;

    // Draw original first
    ctx.drawImage(originalImage, 0, 0, w, h);
    const origPixels = ctx.getImageData(0, 0, w, h);
    const origData = origPixels.data;

    const output = ctx.createImageData(w, h);
    const out = output.data;
    const alpha = opacity / 100;
    const ambient = ambientIntensity / 100;
    const depthAlpha = depthInfluence / 100; // 0 = no depth effect, 1 = full

    // Pre-compute enabled lights' properties
    const enabledLights = lights.filter(l => l.enabled);
    const dim = Math.max(w, h);
    const lightProps = enabledLights.map(l => {
      // Radius in pixels — radial uses tighter scale for focused orb-like pools
      const scale = l.shape === 'radial' ? 0.25 : 1.0;
      const radiusPx = l.radius * dim * scale;
      const invTwoSigmaSq = 1 / (2 * radiusPx * radiusPx);
      // Spot-specific pre-computation
      const coneCos = Math.cos((l.coneAngle * Math.PI) / 180);
      // Line-specific: endpoints in pixel space
      const ltx = l.tx * w;
      const lty = l.ty * h;
      const lx = l.x * w;
      const ly = l.y * h;
      // Line segment vector and squared length
      const segDx = ltx - lx;
      const segDy = lty - ly;
      const segLenSq = segDx * segDx + segDy * segDy;

      // Spotlights get strong normal modulation for directional depth;
      // radial stays subtle; line handles normals internally (rim light)
      const normalStrength = l.shape === 'spot' ? 0.7 : 0.3;

      return {
        shape: l.shape,
        lx, ly,
        lz: l.z * dim,
        ldz: l.dz,           // depth position 0=behind, 1=in front
        ltx, lty,
        rgb: hexToRgb(l.color),
        intensity: l.intensity,
        invTwoSigmaSq,
        coneCos,
        softness: l.softness,
        segDx, segDy, segLenSq,
        normalStrength,
      };
    });

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const pi = i * 4;

        // Decode normal from RGB [0,255] -> [-1,1]
        const nx = (pixels[pi] / 255) * 2 - 1;
        const ny = (pixels[pi + 1] / 255) * 2 - 1;
        const nz = (pixels[pi + 2] / 255) * 2 - 1;

        // Accumulate light contribution
        let lr = ambient, lg = ambient, lb = ambient;

        for (let li = 0; li < lightProps.length; li++) {
          const light = lightProps[li];
          const dx = light.lx - x;
          const dy = light.ly - y;
          const dist2d = dx * dx + dy * dy;

          // Per-shape falloff
          let falloff: number;
          let rimNormalOverride = -1; // -1 means no override (use standard normal calc)

          if (light.shape === 'spot') {
            // Vector from light to pixel (normalized)
            const toPxDx = x - light.lx;
            const toPxDy = y - light.ly;
            const toPxLen = Math.sqrt(toPxDx * toPxDx + toPxDy * toPxDy);
            if (toPxLen < 0.001) {
              falloff = 1.0; // at light center
            } else {
              // Aim direction from light to target
              const aimDx = light.ltx - light.lx;
              const aimDy = light.lty - light.ly;
              const aimLen = Math.sqrt(aimDx * aimDx + aimDy * aimDy);
              if (aimLen < 0.001) {
                falloff = Math.exp(-dist2d * light.invTwoSigmaSq);
              } else {
                const cosAngle = (toPxDx * aimDx + toPxDy * aimDy) / (toPxLen * aimLen);
                const coneFalloff = smoothstep(
                  light.coneCos - light.softness * 0.3,
                  light.coneCos,
                  cosAngle
                );
                falloff = coneFalloff * Math.exp(-dist2d * light.invTwoSigmaSq);
              }
            }
          } else if (light.shape === 'line') {
            // Edge/rim light: the line defines a light source edge.
            // Surfaces facing toward the line glow (rim highlight),
            // surfaces facing away stay dark. Uses perpendicular direction
            // from line to pixel as the light direction for normal modulation.
            if (light.segLenSq < 0.001) {
              falloff = Math.exp(-dist2d * light.invTwoSigmaSq);
            } else {
              const t = Math.max(0, Math.min(1,
                ((x - light.lx) * light.segDx + (y - light.ly) * light.segDy) / light.segLenSq
              ));
              const closestX = light.lx + t * light.segDx;
              const closestY = light.ly + t * light.segDy;
              const perpDx = x - closestX;
              const perpDy = y - closestY;
              const perpDist2 = perpDx * perpDx + perpDy * perpDy;
              // Gentle distance falloff — rim effect should reach across the image
              falloff = Math.exp(-perpDist2 * light.invTwoSigmaSq);

              // Override normal modulation: use perpendicular direction as light direction
              // so surfaces facing the line edge get the rim highlight
              const perpLen = Math.sqrt(perpDist2 + light.lz * light.lz);
              if (perpLen > 0.001) {
                // Direction from pixel toward the line (reversed perp)
                const rimDot = nx * (-perpDx / perpLen) + ny * (-perpDy / perpLen) + nz * (light.lz / perpLen);
                // Strong normal influence — rim light is all about surface angle
                rimNormalOverride = 0.15 + 0.85 * Math.max(0, rimDot);
              }
            }
          } else {
            // Radial (default)
            falloff = Math.exp(-dist2d * light.invTwoSigmaSq);
          }

          // Height component: light above the image plane (existing z)
          const heightZ = light.lz;

          // Depth component: 3D distance between light's depth position and surface depth
          // light.ldz: 0 = behind/far, 0.5 = middle, 1 = in front/close
          // surfaceDepth: 0 = far from camera, 1 = close to camera
          // depthDiff > 0 means light is in front of surface, < 0 means behind
          let depthZ = 0;
          if (depthAlpha > 0 && depthPixels) {
            const surfaceDepth = depthPixels[pi] / 255;
            const depthDiff = light.ldz - surfaceDepth;
            // Scale to scene units — 0.6 factor gives strong visible depth separation
            depthZ = depthDiff * dim * depthAlpha * 0.6;
          }

          // Combined Z for light direction (height + depth offset)
          const totalZ = heightZ + depthZ;

          // Normal-based modulation using full 3D light direction
          let normalMod = 1.0;
          if (rimNormalOverride >= 0) {
            // Rim/edge light: use pre-computed perpendicular normal modulation
            normalMod = rimNormalOverride;
          } else {
            const len = Math.sqrt(dist2d + totalZ * totalZ);
            if (len > 0) {
              const dot = nx * (dx / len) + ny * (dy / len) + nz * (totalZ / len);
              normalMod = 1.0 - light.normalStrength + light.normalStrength * Math.max(0, dot);
            }
          }

          // Depth also attenuates falloff: surfaces far from light in depth get less light
          let depthFalloff = 1.0;
          if (depthAlpha > 0 && depthPixels) {
            const surfaceDepth = depthPixels[pi] / 255;
            const depthDist = Math.abs(light.ldz - surfaceDepth);
            // Gaussian in depth space — surfaces at same depth as light get full light
            depthFalloff = 1.0 - depthAlpha + depthAlpha * Math.exp(-depthDist * depthDist * 8);
          }

          const contribution = falloff * normalMod * depthFalloff * light.intensity;
          lr += contribution * light.rgb[0];
          lg += contribution * light.rgb[1];
          lb += contribution * light.rgb[2];
        }

        // Multiply original image by accumulated light (preserves photo detail)
        const litR = Math.min(255, Math.round(origData[pi]     * lr));
        const litG = Math.min(255, Math.round(origData[pi + 1] * lg));
        const litB = Math.min(255, Math.round(origData[pi + 2] * lb));

        // Blend lit result with original at opacity
        out[pi]     = Math.round(origData[pi]     * (1 - alpha) + litR * alpha);
        out[pi + 1] = Math.round(origData[pi + 1] * (1 - alpha) + litG * alpha);
        out[pi + 2] = Math.round(origData[pi + 2] * (1 - alpha) + litB * alpha);
        out[pi + 3] = 255;
      }
    }

    ctx.putImageData(output, 0, 0);
  }, [normalData, depthData, originalImage, lights, opacity, ambientIntensity, depthInfluence, viewMode, analysisWidth, analysisHeight, depthMapUrl]);

  // --- Light dragging (mouse) ---
  const getHandleAtPos = useCallback((clientX: number, clientY: number): { id: string; handle: 'position' | 'target' } | null => {
    const container = canvasContainerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    const hitRadius = 24 / rect.width;
    const hitRadiusSq = hitRadius * hitRadius;

    // Check lights in reverse order (top-most first)
    // Check target handles first (they're smaller, so should take priority when overlapping)
    for (let i = lights.length - 1; i >= 0; i--) {
      const l = lights[i];
      if (l.shape === 'radial') continue;
      const dx = nx - l.tx;
      const dy = ny - l.ty;
      if (dx * dx + dy * dy < hitRadiusSq) {
        return { id: l.id, handle: 'target' };
      }
    }
    // Then check position handles
    for (let i = lights.length - 1; i >= 0; i--) {
      const l = lights[i];
      const dx = nx - l.x;
      const dy = ny - l.y;
      if (dx * dx + dy * dy < hitRadiusSq) {
        return { id: l.id, handle: 'position' };
      }
    }
    return null;
  }, [lights]);

  const updateHandlePosition = useCallback((lightId: string, handle: 'position' | 'target', clientX: number, clientY: number) => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    setLights(prev => prev.map(l => {
      if (l.id !== lightId) return l;
      if (handle === 'target') return { ...l, tx: nx, ty: ny };
      return { ...l, x: nx, y: ny };
    }));
  }, []);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    const hit = getHandleAtPos(e.clientX, e.clientY);
    setShowAddMenu(false);
    if (hit) {
      setSelectedLightId(hit.id);
      setDraggingLightId(hit.id);
      setDraggingHandle(hit.handle);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    } else {
      setSelectedLightId(null);
    }
  }, [getHandleAtPos]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingLightId) return;
    e.preventDefault();
    updateHandlePosition(draggingLightId, draggingHandle, e.clientX, e.clientY);
  }, [draggingLightId, draggingHandle, updateHandlePosition]);

  const handleCanvasPointerUp = useCallback(() => {
    setDraggingLightId(null);
  }, []);

  // --- Light management ---
  const addLight = (shape: LightShape = 'radial') => {
    if (lights.length >= 5) return;
    const id = `light-${lightIdCounter++}`;
    let newLight: Light;
    if (shape === 'spot') {
      newLight = {
        id, shape: 'spot',
        x: 0.3, y: 0.3, z: 0.5, dz: 0.5,
        tx: 0.5, ty: 0.5,
        color: '#ffffff', intensity: 1.0, radius: 0.5, enabled: true,
        coneAngle: 30, softness: 0.5,
      };
    } else if (shape === 'line') {
      newLight = {
        id, shape: 'line',
        x: 0.3, y: 0.5, z: 0.5, dz: 0.5,
        tx: 0.7, ty: 0.5,
        color: '#ffffff', intensity: 1.0, radius: 0.5, enabled: true,
        coneAngle: 30, softness: 0.5,
      };
    } else {
      newLight = {
        id, shape: 'radial',
        x: 0.5, y: 0.5, z: 0.5, dz: 0.5,
        tx: 0.5, ty: 0.5,
        color: '#ffffff', intensity: 1.0, radius: 0.5, enabled: true,
        coneAngle: 30, softness: 0.5,
      };
    }
    setLights(prev => [...prev, newLight]);
    setSelectedLightId(id);
    setShowAddMenu(false);
  };

  const removeLight = (id: string) => {
    setLights(prev => prev.filter(l => l.id !== id));
    if (selectedLightId === id) {
      setSelectedLightId(lights.find(l => l.id !== id)?.id ?? null);
    }
  };

  const updateLight = (id: string, updates: Partial<Light>) => {
    setLights(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const selectedLight = lights.find(l => l.id === selectedLightId) ?? null;

  // --- Download ---
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `lighting-ref-multilight.png`;
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
            {/* Canvas with light dots overlay */}
            <div className="flex-1 min-w-0">
              <div
                ref={canvasContainerRef}
                className="relative rounded-lg overflow-hidden border border-border bg-black select-none"
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                style={{ touchAction: 'none' }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto"
                  style={{ display: 'block' }}
                />
                {/* Light handle overlays */}
                {viewMode === 'matcap' && showHandles && lights.map(light => {
                  const isSelected = selectedLightId === light.id;
                  const disabledClass = !light.enabled ? 'opacity-40' : '';

                  // SVG overlay for connecting lines (spot/line)
                  const connectingLine = (light.shape === 'spot' || light.shape === 'line') ? (
                    <svg
                      key={`${light.id}-line`}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ overflow: 'visible' }}
                    >
                      <line
                        x1={`${light.x * 100}%`}
                        y1={`${light.y * 100}%`}
                        x2={`${light.tx * 100}%`}
                        y2={`${light.ty * 100}%`}
                        stroke={isSelected ? 'white' : 'rgba(255,255,255,0.5)'}
                        strokeWidth={isSelected ? 2 : 1}
                        strokeDasharray={light.shape === 'spot' ? '6 3' : 'none'}
                        className={disabledClass}
                      />
                    </svg>
                  ) : null;

                  // Primary position handle
                  const positionHandle = (
                    <div
                      className={`absolute w-6 h-6 rounded-full border-2 pointer-events-none transition-shadow ${
                        isSelected
                          ? 'border-white ring-2 ring-white/50 shadow-lg'
                          : 'border-white/70 shadow-md'
                      } ${disabledClass}`}
                      style={{
                        left: `${light.x * 100}%`,
                        top: `${light.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: light.color,
                        boxShadow: light.enabled
                          ? `0 0 ${12 * light.intensity}px ${light.color}`
                          : undefined,
                      }}
                    />
                  );

                  // Target/endpoint handle for spot and line
                  const targetHandle = (light.shape === 'spot' || light.shape === 'line') ? (
                    <div
                      className={`absolute w-4 h-4 rounded-full border-2 pointer-events-none transition-shadow ${
                        isSelected
                          ? 'border-white ring-1 ring-white/40'
                          : 'border-white/60'
                      } ${disabledClass}`}
                      style={{
                        left: `${light.tx * 100}%`,
                        top: `${light.ty * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: light.shape === 'line' ? light.color : 'transparent',
                        boxShadow: light.shape === 'line' && light.enabled
                          ? `0 0 ${8 * light.intensity}px ${light.color}`
                          : undefined,
                      }}
                    >
                      {light.shape === 'spot' && (
                        <div className="w-2 h-2 rounded-full bg-white/80 absolute inset-0 m-auto" />
                      )}
                    </div>
                  ) : null;

                  return (
                    <div key={light.id}>
                      {connectingLine}
                      {positionHandle}
                      {targetHandle}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controls sidebar */}
            <div className="lg:w-60 space-y-4 flex-shrink-0">
              {/* Light list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lights</p>
                  {lights.length < 5 && (
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className="h-6 px-1.5 gap-0.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      {showAddMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                          <button
                            onClick={() => addLight('radial')}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted/50"
                          >
                            <Circle className="w-3.5 h-3.5" />
                            Radial
                          </button>
                          <button
                            onClick={() => addLight('spot')}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted/50"
                          >
                            <Flashlight className="w-3.5 h-3.5" />
                            Spotlight
                          </button>
                          <button
                            onClick={() => addLight('line')}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted/50"
                          >
                            <Minus className="w-3.5 h-3.5" />
                            Rim Light
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {lights.map((light, idx) => (
                    <button
                      key={light.id}
                      onClick={() => setSelectedLightId(light.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                        selectedLightId === light.id
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-border flex-shrink-0"
                        style={{ backgroundColor: light.color }}
                      />
                      <span className="flex-1 text-left">
                        {light.shape === 'spot' ? 'Spot' : light.shape === 'line' ? 'Rim' : 'Radial'} {idx + 1}
                      </span>
                      {!light.enabled && (
                        <span className="text-[10px] text-muted-foreground">OFF</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected light controls */}
              {selectedLight && (
                <div className="space-y-3 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {selectedLight.shape === 'spot' ? 'Spot' : selectedLight.shape === 'line' ? 'Rim' : 'Radial'} {lights.findIndex(l => l.id === selectedLight.id) + 1}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateLight(selectedLight.id, { enabled: !selectedLight.enabled })}
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          selectedLight.enabled
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {selectedLight.enabled ? 'ON' : 'OFF'}
                      </button>
                      {lights.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLight(selectedLight.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Shape selector */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Shape</p>
                    <div className="flex gap-1">
                      {([
                        { shape: 'radial' as LightShape, icon: Circle, label: 'Radial' },
                        { shape: 'spot' as LightShape, icon: Flashlight, label: 'Spot' },
                        { shape: 'line' as LightShape, icon: Minus, label: 'Rim' },
                      ]).map(({ shape, icon: Icon, label }) => (
                        <button
                          key={shape}
                          onClick={() => {
                            const updates: Partial<Light> = { shape };
                            // Set sensible defaults when switching shape
                            if (shape === 'spot' && selectedLight.shape !== 'spot') {
                              updates.tx = Math.min(1, selectedLight.x + 0.2);
                              updates.ty = Math.min(1, selectedLight.y + 0.2);
                            } else if (shape === 'line' && selectedLight.shape !== 'line') {
                              updates.tx = Math.min(1, selectedLight.x + 0.4);
                              updates.ty = selectedLight.y;
                            }
                            updateLight(selectedLight.id, updates);
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                            selectedLight.shape === shape
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                          title={label}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Color</p>
                    <input
                      type="color"
                      value={selectedLight.color}
                      onChange={(e) => updateLight(selectedLight.id, { color: e.target.value })}
                      className="w-full h-8 rounded cursor-pointer border border-border"
                    />
                  </div>

                  {/* Intensity */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Intensity: {Math.round(selectedLight.intensity * 100)}%
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={200}
                      value={Math.round(selectedLight.intensity * 100)}
                      onChange={(e) => updateLight(selectedLight.id, { intensity: Number(e.target.value) / 100 })}
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* Radius */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Radius: {Math.round(selectedLight.radius * 100)}%
                    </p>
                    <input
                      type="range"
                      min={5}
                      max={150}
                      value={Math.round(selectedLight.radius * 100)}
                      onChange={(e) => updateLight(selectedLight.id, { radius: Number(e.target.value) / 100 })}
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* Height (z) */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Height: {Math.round(selectedLight.z * 100)}%
                    </p>
                    <input
                      type="range"
                      min={5}
                      max={150}
                      value={Math.round(selectedLight.z * 100)}
                      onChange={(e) => updateLight(selectedLight.id, { z: Number(e.target.value) / 100 })}
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* Depth position (forward/back) */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Depth: {selectedLight.dz <= 0.33 ? 'Behind' : selectedLight.dz >= 0.67 ? 'In Front' : 'Middle'}
                    </p>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(selectedLight.dz * 100)}
                      onChange={(e) => updateLight(selectedLight.id, { dz: Number(e.target.value) / 100 })}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground -mt-0.5">
                      <span>Behind</span>
                      <span>In Front</span>
                    </div>
                  </div>

                  {/* Spot-only: Cone Angle */}
                  {selectedLight.shape === 'spot' && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Cone Angle: {selectedLight.coneAngle}°
                        </p>
                        <input
                          type="range"
                          min={15}
                          max={60}
                          value={selectedLight.coneAngle}
                          onChange={(e) => updateLight(selectedLight.id, { coneAngle: Number(e.target.value) })}
                          className="w-full accent-primary"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Softness: {Math.round(selectedLight.softness * 100)}%
                        </p>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(selectedLight.softness * 100)}
                          onChange={(e) => updateLight(selectedLight.id, { softness: Number(e.target.value) / 100 })}
                          className="w-full accent-primary"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Global controls */}
              <div className="space-y-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Ambient: {ambientIntensity}%
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={ambientIntensity}
                    onChange={(e) => setAmbientIntensity(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
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

                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Depth Influence: {depthInfluence}%
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={depthInfluence}
                    onChange={(e) => setDepthInfluence(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Raised surfaces catch more light
                  </p>
                </div>
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

            <Button
              size="sm"
              variant={showHandles ? 'outline' : 'default'}
              onClick={() => setShowHandles(!showHandles)}
              title={showHandles ? 'Hide light handles' : 'Show light handles'}
            >
              {showHandles ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>

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
            Drag light handles on the image to reposition. Spotlights and line lights have a second draggable handle for aim/endpoint.
          </p>
        </div>
      )}
    </div>
  );
}
