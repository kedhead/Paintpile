'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;

        if (result.outcome === 'accepted') {
            setShowPrompt(false);
        }
        setDeferredPrompt(null);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
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
                            onClick={handleInstall}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Install
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="w-auto px-2 hover:bg-primary-foreground/10"
                            onClick={() => setShowPrompt(false)}
                        >
                            Not now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
