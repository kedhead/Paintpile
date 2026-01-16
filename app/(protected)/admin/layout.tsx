'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isUserAdmin } from '@/lib/auth/admin-check';
import { Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { currentUser, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        async function check() {
            if (!currentUser) {
                setIsAdmin(false);
                setChecking(false);
                return;
            }

            try {
                const adminStatus = await isUserAdmin(currentUser);
                setIsAdmin(adminStatus);
            } catch (error) {
                console.error('Admin check failed:', error);
                setIsAdmin(false);
            } finally {
                setChecking(false);
            }
        }

        if (!authLoading) {
            check();
        }
    }, [currentUser, authLoading]);

    // Show loading state
    if (authLoading || checking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Spinner size="lg" />
            </div>
        );
    }

    // Access Denied
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Card className="max-w-md w-full p-8 text-center border-destructive/20 shadow-lg">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="h-8 w-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">
                        You do not have permission to access the admin area. This incident will be reported.
                    </p>
                </Card>
            </div>
        );
    }

    // Access Granted
    return <>{children}</>;
}
