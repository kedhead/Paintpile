'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PWAContextType {
    isInstallable: boolean;
    install: () => Promise<void>;
    dismissPrompt: () => void;
    isDismissed: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if previously dismissed
        const dismissed = localStorage.getItem('pwa_prompt_dismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
        }

        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
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
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    return (
        <PWAContext.Provider value={{
            isInstallable: !!deferredPrompt,
            install,
            dismissPrompt,
            isDismissed
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
