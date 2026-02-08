'use client';

import { useEffect, useState } from 'react';

// Random float between min and max
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Refined, more artistic paint stroke SVG paths (dry brush feel)
const STROKE_PATHS = [
    "M10,50 Q60,5 120,45 T250,55 T380,35", // Long wave
    "M20,80 C60,20 120,20 180,60 S260,110 350,70", // S-curve
    "M320,40 Q250,90 180,50 T40,60", // Reverse wave
    "M50,50 C80,80 150,20 200,50 S300,80 350,40", // Long messy stroke
    "M10,10 L50,50 M60,60 L100,100", // Scattered small strokes
    "M5,50 Q30,10 60,50 T120,50 T180,50 T240,50 T300,50" // Continuous jittery line
];

// More realistic splatter shapes
const SPLATTER_PATHS = [
    "M25,25 C10,10 5,40 20,50 C5,60 20,80 30,70 C40,90 60,80 50,60 C70,50 60,30 40,40 C50,10 30,10 25,25 Z", // Classic splash
    "M40,40 Q20,20 40,10 Q60,20 50,40 Q80,30 70,60 Q50,90 40,60 Q10,70 20,40 Z", // Multi-point splash
    "M30,30 C10,20 10,50 30,60 C20,80 50,80 60,60 C80,50 60,20 40,30 Z", // Rounder blob
    "M10,10 L15,15 M20,20 L25,25 M30,30 L35,35", // Fine mist
    "M50,50 m-5,0 a5,5 0 1,0 10,0 a5,5 0 1,0 -10,0" // Small dot
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
        // Gold and Silver Palette
        const colors = [
            '#D4AF37', // Metallic Gold
            '#FFD700', // Bright Gold
            '#B8860B', // Dark Gold/Amber
            '#C0C0C0', // Silver
            '#D3D3D3', // Light Silver
            '#E5E4E2', // Platinum/Metallic White
            '#A9A9A9', // Dark Gray/Steel
        ];

        const newElements: PaintElement[] = [];
        const count = 35; // Denser background for more "premium" feel

        for (let i = 0; i < count; i++) {
            const isStroke = Math.random() > 0.4; // 60% strokes, 40% splatters
            const path = isStroke
                ? STROKE_PATHS[Math.floor(Math.random() * STROKE_PATHS.length)]
                : SPLATTER_PATHS[Math.floor(Math.random() * SPLATTER_PATHS.length)];

            const type = isStroke ? 'stroke' : 'splatter';

            newElements.push({
                id: i,
                type,
                path,
                x: random(-5, 105),
                y: random(-5, 105),
                scale: isStroke ? random(1, 3.5) : random(0.3, 1.8),
                rotation: random(0, 360),
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: random(0.1, 0.35), // Subtle layering
                delay: random(0, 1.2),
                duration: random(8, 15),
            });
        }

        setElements(newElements);
    }, []);

    if (!mounted) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <svg className="w-full h-full">
                <defs>
                    {/* Metallic Sheen / Glow Filter */}
                    <filter id="metallic-gold" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.8" specularExponent="20" lightingColor="#FFD700" result="specular">
                            <fePointLight x="-5000" y="-10000" z="20000" />
                        </feSpecularLighting>
                        <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                    </filter>

                    <filter id="metallic-silver" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.8" specularExponent="25" lightingColor="#FFFFFF" result="specular">
                            <fePointLight x="-5000" y="-10000" z="20000" />
                        </feSpecularLighting>
                        <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                    </filter>

                    <filter id="subtle-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {elements.map((el) => {
                    const isGold = el.color.startsWith('#D') || el.color.startsWith('#F') || el.color.startsWith('#B');
                    const filterId = isGold ? 'metallic-gold' : 'metallic-silver';

                    return (
                        <g
                            key={el.id}
                            style={{
                                transformBox: 'fill-box',
                                transformOrigin: 'center',
                                opacity: 0,
                                animation: `fadeIn 2s ease-out forwards ${el.delay}s, subtleMove ${el.duration}s ease-in-out infinite alternate`,
                            }}
                        >
                            <path
                                d={el.path}
                                fill={el.type === 'splatter' ? el.color : 'none'}
                                stroke={el.type === 'stroke' ? el.color : 'none'}
                                strokeWidth={el.type === 'stroke' ? random(2, 6) : 0}
                                strokeLinecap="round"
                                fillOpacity={el.opacity}
                                strokeOpacity={el.opacity}
                                // combine metallic filter with subtle glow for "wet paint" look
                                filter={`url(#${filterId})`}
                                style={{
                                    transform: `translate(${el.x}vw, ${el.y}vh) rotate(${el.rotation}deg) scale(${el.scale})`,
                                    transformOrigin: 'center',
                                }}
                            />
                        </g>
                    );
                })}
                <style dangerouslySetInnerHTML={{
                    __html: `
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes subtleMove {
                from { transform: translate(0, 0) rotate(0deg); }
                to { transform: translate(5px, 5px) rotate(1deg); }
            }
        `}} />
            </svg>
        </div>
    );
}
