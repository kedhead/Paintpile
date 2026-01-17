'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface SidebarAdProps {
    title?: string;
    description?: string;
    cta?: string;
    href?: string;
    image?: string;
}

export function SidebarAd({
    title = "Element Games",
    description = "Get 15-20% off Warhammer & hobby supplies!",
    cta = "Shop Now",
    href = "https://elementgames.co.uk/?d=10279",
    image
}: SidebarAdProps) {
    return (
        <div className="mt-auto px-4 pb-4">
            <Link href={href} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 transition-all hover:border-indigo-500/40 hover:shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-background/50 px-1.5 py-0.5 rounded">
                            Sponsored
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground/70" />
                    </div>

                    {image && (
                        <div className="mb-3 rounded-lg overflow-hidden aspect-video bg-muted">
                            <img src={image} alt={title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2">
                        {description}
                    </p>

                    <div className="text-xs font-medium text-primary flex items-center gap-1 group-hover:underline">
                        {cta}
                    </div>
                </div>
            </Link>
        </div>
    );
}
