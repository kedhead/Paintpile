'use client';

import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { usePWA } from '@/contexts/PWAContext';

function IOSInstallGuide({ onDismiss }: { onDismiss: () => void }) {
    return (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-card border border-border text-card-foreground p-5 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-base">Install PaintPile</h3>
                <button
                    onClick={onDismiss}
                    className="text-muted-foreground hover:text-foreground transition-colors -mt-1 -mr-1 p-1"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
                Add PaintPile to your home screen for the best experience:
            </p>
            <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">1</span>
                    <span className="flex items-center gap-1.5">
                        Tap the <Share className="w-4 h-4 text-primary inline-block" /> Share button in the toolbar
                    </span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">2</span>
                    <span className="flex items-center gap-1.5">
                        Scroll down and tap <Plus className="w-4 h-4 text-primary inline-block" /> <strong>Add to Home Screen</strong>
                    </span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">3</span>
                    <span>Tap <strong>Add</strong> to confirm</span>
                </li>
            </ol>
            <div className="mt-4 pt-3 border-t border-border">
                <button
                    onClick={onDismiss}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    Remind me later
                </button>
            </div>
        </div>
    );
}

function AndroidInstallBanner({
    onInstall,
    onDismiss,
}: {
    onInstall: () => void;
    onDismiss: () => void;
}) {
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
                            onClick={onInstall}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Install
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="w-auto px-2 hover:bg-primary-foreground/10"
                            onClick={onDismiss}
                        >
                            Not now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function InstallPrompt() {
    const {
        isInstallable,
        install,
        showIOSInstallGuide,
        dismissPrompt,
        isDismissed,
        isStandalone,
    } = usePWA();

    // Never show if already running as installed PWA
    if (isStandalone) return null;

    // iOS Safari: show guided instructions
    if (showIOSInstallGuide) {
        return <IOSInstallGuide onDismiss={dismissPrompt} />;
    }

    // Android/Chrome: show native install prompt
    if (isInstallable && !isDismissed) {
        return (
            <AndroidInstallBanner
                onInstall={install}
                onDismiss={dismissPrompt}
            />
        );
    }

    return null;
}
