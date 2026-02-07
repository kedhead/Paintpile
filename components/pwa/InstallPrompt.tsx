'use client';

import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePWA } from '@/contexts/PWAContext';

export function InstallPrompt() {
    const { isInstallable, install, dismissPrompt, isDismissed } = usePWA();

    if (!isInstallable || isDismissed) return null;

    return (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="font-semibold mb-1">Install PaintPile</h3>
                    <p className="text-sm opacity-90 mb-3">
                        Install the app for offline access and a better experience.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="w-full"
                            onClick={install}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Install
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="w-auto px-2 hover:bg-primary-foreground/10"
                            onClick={dismissPrompt}
                        >
                            Not now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
