'use client';

import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface MobileHeaderProps {
    onOpen: () => void;
}

export function MobileHeader({ onOpen }: MobileHeaderProps) {
    return (
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16 border-b border-border bg-card">
            <div className="flex items-center gap-3">
                <button
                    onClick={onOpen}
                    className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 z-50"
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="relative w-8 h-8">
                        <Image
                            src="/paintpile-logo.png"
                            alt="PaintPile"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <span className="font-display font-bold text-lg text-foreground tracking-wide">
                        PAINTPILE
                    </span>
                </Link>
            </div>

            {/* Notification Bell */}
            <NotificationBell />
        </div>
    );
}
