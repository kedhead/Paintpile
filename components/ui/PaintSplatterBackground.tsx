'use client';

import { useEffect, useState } from 'react';

// Random float between min and max
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Artistic paint stroke SVG paths
const STROKE_PATHS = [
    "M10,50 Q60,5 120,45 T250,55 T380,35", // Long wave
    "M20,80 C60,20 120,20 180,60 S260,110 350,70", // S-curve
    "M320,40 Q250,90 180,50 T40,60", // Reverse wave
    "M50,50 C80,80 150,20 200,50 S300,80 350,40" // Messy stroke
];

// Complex splatter shapes
const SPLATTER_PATHS = [
    "M25,25 C10,10 5,40 20,50 C5,60 20,80 30,70 C40,90 60,80 50,60 C70,50 60,30 40,40 C50,10 30,10 25,25 Z", // Blob 1
    "M40,40 Q20,20 40,10 Q60,20 50,40 Q80,30 70,60 Q50,90 40,60 Q10,70 20,40 Z", // Blob 2
    "M30,30 C10,20 10,50 30,60 C20,80 50,80 60,60 C80,50 60,20 40,30 Z", // Blob 3
    "M50,50 C30,30 30,70 50,80 C40,90 70,90 80,70 C90,60 70,30 50,50 Z" // Blob 4
];

interface PaintElement {
    id: number;
    type: 'stroke' | 'splatter';
    path: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    color: string;
    opacity: number;
    delay: number;
    duration: number;
}

export default function PaintSplatterBackground() {
    const [elements, setElements] = useState<PaintElement[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const colors = [
            '#d97706', // amber-600
            '#b45309', // amber-700
            '#f59e0b', // amber-500
            '#78350f', // amber-900 
            '#4b5563', // gray-600
        ];

        const newElements: PaintElement[] = [];
        // Increase count for fuller background
        const count = 25;

        for (let i = 0; i < count; i++) {
            const isStroke = Math.random() > 0.3; // 70% strokes, 30% splatters for flow
            const path = isStroke
                ? STROKE_PATHS[Math.floor(Math.random() * STROKE_PATHS.length)]
                : SPLATTER_PATHS[Math.floor(Math.random() * SPLATTER_PATHS.length)];

            const type = isStroke ? 'stroke' : 'splatter';

            newElements.push({
                id: i,
                type,
                path,
                x: random(-10, 110), // percent, allow slightly off-screen
                y: random(-10, 110), // percent
                scale: isStroke ? random(1.5, 4) : random(0.5, 2), // larger strokes
                rotation: random(0, 360),
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: random(0.15, 0.4), // Low opacity for subtle background
                delay: random(0, 1.5),
                duration: random(10, 20), // For subtle movement
            });
        }

        setElements(newElements);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <svg className="w-full h-full">
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {elements.map((el) => (
                    <g
                        key={el.id}
                        style={{
                            transformBox: 'fill-box',
                            transformOrigin: 'center',
                            opacity: 0,
                            animation: `fadeIn 1.5s ease-out forwards ${el.delay}s, float ${el.duration}s ease-in-out infinite alternate`,
                        }}
                    >
                        <path
                            d={el.path}
                            fill={el.type === 'splatter' ? el.color : 'none'}
                            stroke={el.type === 'stroke' ? el.color : 'none'}
                            strokeWidth={el.type === 'stroke' ? random(3, 8) : 0}
                            strokeLinecap="round"
                            fillOpacity={el.opacity}
                            strokeOpacity={el.opacity}
                            filter="url(#glow)"
                            style={{
                                transform: `translate(${el.x}vw, ${el.y}vh) rotate(${el.rotation}deg) scale(${el.scale})`,
                                transformOrigin: 'center',
                            }}
                        />
                    </g>
                ))}
                <style dangerouslySetInnerHTML={{
                    __html: `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes float {
                from { transform: translateY(0px) rotate(0deg); }
                to { transform: translateY(10px) rotate(2deg); }
            }
        `}} />
            </svg>
        </div>
    );
}
