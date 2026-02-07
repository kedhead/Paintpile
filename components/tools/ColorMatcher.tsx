import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Crosshair, RefreshCw, Droplet, BookMarked, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Paint, UserOwnedPaint } from '@/types/paint';
import { findTopMatches, hexToRgb, rgbToHex } from '@/lib/utils/color-math';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { createDiaryEntry } from '@/lib/firestore/diary';
import { uploadDiaryImage } from '@/lib/firebase/storage';
import { toast } from 'sonner';

// Threshold for "Good Match" (CIE76 DeltaE < 2.3 is JND, < 10 is acceptable match for paints)
const MATCH_THRESHOLD = 15;

interface ColorMatcherProps {
    allPaints: Paint[];
    userInventory: UserOwnedPaint[];
}

export function ColorMatcher({ allPaints, userInventory }: ColorMatcherProps) {
    const { currentUser } = useAuth();
    const [image, setImage] = useState<string | null>(null);
    const [pickedColor, setPickedColor] = useState<string | null>(null);
    const [matches, setMatches] = useState<{ match: Paint; distance: number; owned: boolean }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const displayImageRef = useRef<HTMLImageElement>(null);

    // --- Image Handling ---
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setImage(result);
            setPickedColor(null);
            setMatches([]);
        };
        reader.readAsDataURL(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1
    });

    const reset = () => {
        setImage(null);
        setPickedColor(null);
        setMatches([]);
    };

    // --- Color Picking ---
    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!displayImageRef.current || !canvasRef.current) return;

        const img = displayImageRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ensure canvas matches image natural size
        if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
        }

        // Calculate click coordinates relative to natural image size
        const rect = img.getBoundingClientRect();
        const scaleX = img.naturalWidth / rect.width;
        const scaleY = img.naturalHeight / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        // Get pixel data
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = rgbToHex({ r: pixel[0], g: pixel[1], b: pixel[2] });

        setPickedColor(hex);
        findMatches(hex);
    };

    // --- Matching Logic ---
    const findMatches = (targetHex: string) => {
        setIsProcessing(true);
        setTimeout(() => {
            // Find top matches from ALL paints
            // Map Paint.hexColor to .hex for compatibility with utils
            const candidates = allPaints.map(p => ({ ...p, hex: p.hexColor }));
            const topMatches = findTopMatches(targetHex, candidates, 10);

            // Annotate with ownership
            const annotatedMatches = topMatches.map(m => ({
                match: m.match as Paint, // Cast back to Paint since we just extended it
                distance: m.distance,
                owned: userInventory.some(up => up.paintId === (m.match as Paint).paintId)
            }));

            setMatches(annotatedMatches);
            setIsProcessing(false);
        }, 100); // Slight delay for UI responsiveness
    };

    // --- Save to Diary ---
    const handleSaveToDiary = async () => {
        if (!currentUser || !pickedColor) return;

        try {
            setIsSaving(true);

            // 1. Upload Image (if present)
            let imageUrl = '';
            if (image) {
                // Convert base64 to file
                const res = await fetch(image);
                const blob = await res.blob();
                const file = new File([blob], "color-match-source.jpg", { type: "image/jpeg" });

                imageUrl = await uploadDiaryImage(currentUser.uid, file);
            }

            // 2. Format matches for content
            const topMatch = matches[0]?.match;
            const content = `
**Color Match Analysis**
Source Color: ${pickedColor}

**Top Match:**
${topMatch ? `- ${topMatch.name} (${topMatch.brand})` : 'No close matches found'}

**Other Candidates:**
${matches.slice(1, 5).map(m => `- ${m.match.name} (${m.match.brand}) - ΔE: ${m.distance.toFixed(2)}`).join('\n')}
            `.trim();

            // 3. Create Diary Entry
            await createDiaryEntry(currentUser.uid, {
                title: `Color Match: ${topMatch?.name || pickedColor}`,
                content: content,
                links: imageUrl ? [{ url: imageUrl, type: 'image', description: 'Source Image' }] : [],
                tags: ['Color Match', 'Tool Result'],
            });

            toast.success('Saved to Paint Diary');
        } catch (error) {
            console.error('Error saving to diary:', error);
            toast.error('Failed to save entry');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Upload / Image Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    {!image ? (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl h-[300px] md:h-[400px] flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-card/50'
                                }`}
                        >
                            <input {...getInputProps()} />
                            <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                            <p className="text-lg font-medium text-foreground">Drop reference photo here</p>
                            <p className="text-sm text-muted-foreground mt-2">or click to browse</p>
                        </div>
                    ) : (
                        <div className="relative group rounded-xl overflow-hidden border border-border bg-black/5">
                            <img
                                ref={displayImageRef}
                                src={image}
                                alt="Reference"
                                className="w-full h-auto max-h-[300px] md:max-h-[500px] object-contain cursor-crosshair"
                                onClick={handleImageClick}
                            />

                            {/* Hidden canvas for pixel reading */}
                            <canvas ref={canvasRef} className="hidden" />

                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={reset}
                            >
                                <X className="w-4 h-4" />
                            </Button>

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm pointer-events-none">
                                Tap anywhere to pick color
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Area */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg shadow-sm border border-border flex items-center justify-center overflow-hidden relative">
                            {pickedColor ? (
                                <div className="absolute inset-0" style={{ backgroundColor: pickedColor }} />
                            ) : (
                                <div className="bg-secondary/50 w-full h-full flex items-center justify-center">
                                    <Droplet className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Picked Color</h3>
                            <p className="text-sm text-muted-foreground font-mono">
                                {pickedColor || 'No color selected'}
                            </p>
                        </div>

                        {/* Save Button */}
                        {currentUser && pickedColor && (
                            <div className="ml-auto">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2"
                                    onClick={handleSaveToDiary}
                                    disabled={isSaving || isProcessing}
                                >
                                    {isSaving ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {isSaving ? 'Saving...' : 'Save to Diary'}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-border my-6" />

                    <h3 className="text-lg font-semibold mb-4">Best Matches</h3>

                    {isProcessing ? (
                        <div className="flex justify-center p-8">
                            <Spinner />
                        </div>
                    ) : matches.length > 0 ? (
                        <div className="space-y-3">
                            {matches.map(({ match, distance, owned }, index) => (
                                <motion.div
                                    key={match.paintId}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`p-4 rounded-lg border flex items-center gap-4 transition-colors ${owned ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'
                                        }`}
                                >
                                    {/* Color Swatch */}
                                    <div
                                        className="w-10 h-10 rounded-full shadow-sm border border-border/20 shrink-0"
                                        style={{ backgroundColor: match.hexColor }}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium truncate">{match.name}</h4>
                                            {owned && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                                    OWNED
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{match.brand}</p>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xs font-semibold">
                                            {distance < 5 ? (
                                                <span className="text-green-600">Perfect</span>
                                            ) : distance < 10 ? (
                                                <span className="text-green-500">Close</span>
                                            ) : distance < 20 ? (
                                                <span className="text-yellow-600">Similar</span>
                                            ) : (
                                                <span className="text-muted-foreground">Dist.</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-mono">
                                            ΔE {distance.toFixed(1)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            {pickedColor ? (
                                <p>No matches found in database.</p>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Crosshair className="w-8 h-8 opacity-20" />
                                    <p>Pick a color to see matches</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

