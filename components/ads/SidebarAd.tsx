'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAdSettings } from '@/lib/firestore/ads';
import { AdSettings, DEFAULT_AD_SETTINGS } from '@/types/ads';

interface SidebarAdProps {
    overrideSettings?: AdSettings;
}

export function SidebarAd({ overrideSettings }: SidebarAdProps) {
    const [settings, setSettings] = useState<AdSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If overrides are provided (e.g. admin preview), use them directly
        if (overrideSettings) {
            setSettings(overrideSettings);
            setLoading(false);
            return;
        }

        // Otherwise fetch from Firestore
        async function fetchSettings() {
            try {
                const data = await getAdSettings();
                setSettings(data);
            } catch (error) {
                console.error("Failed to fetch ad settings", error);
                setSettings(DEFAULT_AD_SETTINGS);
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, [overrideSettings]);

    // Don't render if loading or specifically disabled
    if (loading) return null;
    if (!settings?.enabled) return null;

    // Use settings or fallbacks
    const {
        title = DEFAULT_AD_SETTINGS.title,
        description = DEFAULT_AD_SETTINGS.description,
        ctaText = DEFAULT_AD_SETTINGS.ctaText,
        linkUrl = DEFAULT_AD_SETTINGS.linkUrl,
        imageUrl
    } = settings;

    return (
        <div className="mt-auto px-4 pb-4">
            <Link href={linkUrl} target="_blank" rel="noopener noreferrer" className="block group">
                <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 transition-all hover:border-indigo-500/40 hover:shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-background/50 px-1.5 py-0.5 rounded">
                            Sponsored
                        </span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground/70" />
                    </div>

                    {imageUrl && (
                        <div className="mb-3 rounded-lg overflow-hidden aspect-video bg-muted relative">
                            {/* Use standard img for external URLs to avoid Next/Image config issues */}
                            <img
                                src={imageUrl}
                                alt={title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3 line-clamp-2">
                        {description}
                    </p>

                    <div className="text-xs font-medium text-primary flex items-center gap-1 group-hover:underline">
                        {ctaText}
                    </div>
                </div>
            </Link>
        </div>
    );
}
