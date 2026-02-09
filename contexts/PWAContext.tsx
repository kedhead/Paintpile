'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PWAContextType {
    isInstallable: boolean;
    install: () => Promise<void>;
    isIOS: boolean;
    isIOSSafari: boolean;
    isStandalone: boolean;
    showIOSInstallGuide: boolean;
    dismissPrompt: () => void;
    isDismissed: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

function getIsIOS(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function getIsIOSSafari(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = !(/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua));
    return isIOS && isSafari;
}

function getIsStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isIOSSafari, setIsIOSSafari] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if previously dismissed (with 7-day expiry for re-prompting)
        const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at');
        if (dismissedAt) {
            const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) {
                setIsDismissed(true);
            } else {
                localStorage.removeItem('pwa_prompt_dismissed_at');
            }
        }
        // Also respect permanent dismiss from older version
        if (localStorage.getItem('pwa_prompt_dismissed') === 'true') {
            setIsDismissed(true);
        }

        // Detect platform
        setIsIOS(getIsIOS());
        setIsIOSSafari(getIsIOSSafari());
        setIsStandalone(getIsStandalone());

        // Android install prompt
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        const installedHandler = () => {
            setDeferredPrompt(null);
        };
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const dismissPrompt = () => {
        setIsDismissed(true);
        localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString());
    };

    const showIOSInstallGuide = isIOSSafari && !isStandalone && !isDismissed;

    return (
        <PWAContext.Provider value={{
            isInstallable: !!deferredPrompt,
            install,
            isIOS,
            isIOSSafari,
            isStandalone,
            showIOSInstallGuide,
            dismissPrompt,
            isDismissed,
        }}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
}
