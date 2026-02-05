'use client';

import { useEffect, useState } from 'react';
import { PhotoAnnotation } from '@/types/photo';
import { Paint } from '@/types/paint';
import { getPaintsByIds } from '@/lib/firestore/paints';

interface AnnotationLegendProps {
    annotations: PhotoAnnotation[];
    selectedAnnotationId: string | null;
    onSelectAnnotation: (annotationId: string) => void;
    className?: string;
}

interface AnnotationWithPaints {
    annotation: PhotoAnnotation;
    index: number;
    paints: Paint[];
}

export function AnnotationLegend({
    annotations,
    selectedAnnotationId,
    onSelectAnnotation,
    className = '',
}: AnnotationLegendProps) {
    const [annotationsWithPaints, setAnnotationsWithPaints] = useState<AnnotationWithPaints[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPaints();
    }, [annotations]);

    async function loadPaints() {
        setLoading(true);
        try {
            // Collect all unique paint IDs from all annotations
            const allPaintIds = new Set<string>();
            annotations.forEach((ann) => {
                ann.paints.forEach((p) => allPaintIds.add(p.paintId));
            });

            // Fetch all paints at once
            const paints = await getPaintsByIds(Array.from(allPaintIds));
            const paintMap = new Map(paints.map((p) => [p.paintId, p]));

            // Build annotationsWithPaints array
            const withPaints: AnnotationWithPaints[] = annotations.map((ann, idx) => ({
                annotation: ann,
                index: idx + 1,
                paints: ann.paints
                    .map((p) => paintMap.get(p.paintId))
                    .filter((p): p is Paint => p !== undefined),
            }));

            setAnnotationsWithPaints(withPaints);
        } catch (err) {
            console.error('Error loading paints for legend:', err);
        } finally {
            setLoading(false);
        }
    }

    // Generate consistent color for annotation based on ID
    function getAnnotationColor(annotationId: string): string {
        const hash = annotationId.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 50%)`;
    }

    // Get text color based on background brightness
    function getTextColor(bgColor: string): string {
        if (bgColor.startsWith('hsl')) {
            return '#ffffff';
        }
        if (bgColor.startsWith('#')) {
            const hex = bgColor.slice(1);
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
        }
        return '#ffffff';
    }

    if (loading) {
        return (
            <div className={`p-4 ${className}`}>
                <div className="animate-pulse space-y-2">
                    <div className="h-6 bg-gray-700 rounded w-32" />
                    <div className="h-6 bg-gray-700 rounded w-40" />
                    <div className="h-6 bg-gray-700 rounded w-36" />
                </div>
            </div>
        );
    }

    if (annotationsWithPaints.length === 0) {
        return (
            <div className={`p-4 text-gray-400 text-sm ${className}`}>
                No annotations yet. Click "Add Annotation" to start.
            </div>
        );
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {annotationsWithPaints.map(({ annotation, index, paints }) => {
                const bgColor = paints[0]?.hexColor || getAnnotationColor(annotation.id);
                const textColor = getTextColor(bgColor);
                const isSelected = annotation.id === selectedAnnotationId;

                return (
                    <button
                        key={annotation.id}
                        onClick={() => onSelectAnnotation(annotation.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${isSelected
                                ? 'bg-white/10 ring-1 ring-white/30'
                                : 'hover:bg-white/5'
                            }`}
                    >
                        {/* Numbered Badge - Pentagon style */}
                        <div
                            className="w-7 h-7 flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-md"
                            style={{
                                backgroundColor: bgColor,
                                color: textColor,
                                clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                            }}
                        >
                            {index}
                        </div>

                        {/* Paint Info */}
                        <div className="flex-1 min-w-0">
                            {paints.length > 0 ? (
                                <div className="space-y-0.5">
                                    {paints.map((paint, pIdx) => (
                                        <div
                                            key={paint.paintId}
                                            className="text-sm text-white flex items-center gap-2"
                                        >
                                            <span className="text-gray-400">{paint.brand}</span>
                                            <span className="font-medium truncate">{paint.name}</span>
                                            {paints.length > 1 && pIdx < paints.length - 1 && (
                                                <span className="text-gray-500">+</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : annotation.label ? (
                                <span className="text-sm text-gray-300">{annotation.label}</span>
                            ) : (
                                <span className="text-sm text-gray-500 italic">No paint assigned</span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
