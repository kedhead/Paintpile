'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Database, Palette, Users, Package, Upload, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { isUserAdmin } from '@/lib/auth/admin-check';
import { OrphanedPaintCleanup } from '@/components/admin/OrphanedPaintCleanup';

export default function AdminPage() {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  // Check admin status when currentUser changes
  useEffect(() => {
    async function checkAdmin() {
      setAdminCheckLoading(true);
      const adminStatus = await isUserAdmin(currentUser);
      setIsAdmin(adminStatus);
      setAdminCheckLoading(false);
    }
    checkAdmin();
  }, [currentUser]);

  // Show loading while checking admin status
  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">
            Database management and administrative tools
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Manage Users */}
          <Link href="/admin/manage-users">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Manage Users
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Grant Pro subscriptions and AI feature access to users
                  </p>
                  <Button variant="outline" size="sm">
                    Manage Users →
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Smart Import Paints */}
          <Link href="/admin/smart-import">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Smart Import Paints
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import paints without duplicates - safe to run multiple times
                  </p>
                  <Button variant="outline" size="sm">
                    Smart Import →
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Manage Paint Database */}
          <Link href="/admin/manage-paints">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <Palette className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Manage Paint Database
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clear existing paints or full database reset (⚠️ destructive)
                  </p>
                  <Button variant="outline" size="sm">
                    Manage Paints →
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Import Paints from GitHub */}
          <Link href="/admin/import-github-paints">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <Database className="w-6 h-6 text-green-600 dark:text-green-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Import Paints from GitHub
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import 34 paint manufacturers (2000+ paints) from the miniature-paints repository
                  </p>
                  <Button variant="outline" size="sm">
                    Import from GitHub →
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Scrape Paint Sets */}
          <Link href="/admin/scrape-sets">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Scrape Paint Sets
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use AI to automatically scrape paint sets from Monument, Army Painter, and Citadel websites
                  </p>
                  <Button variant="outline" size="sm">
                    Scrape Sets →
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Import Paints from CSV */}
          <Link href="/admin/import-paints">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <Database className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Import Paints from CSV
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload CSV files to add custom paints (includes web scraping support)
                  </p>
                  <Button variant="outline" size="sm">
                    Import CSV →
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Run Migrations */}
          <Link href="/admin/migrate">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Run Migrations
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add social feature fields to existing projects and users (likeCount, commentCount, followerCount, etc.)
                  </p>
                  <Button variant="outline" size="sm">
                    Run Migration →
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Ad Manager (New) */}
          <Link href="/admin/ads">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Megaphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Manage Ads
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update sidebar ads, change links, or disable them entirely.
                  </p>
                  <Button variant="outline" size="sm">
                    Open Ad Manager →
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Orphaned Paint Cleanup */}
          <OrphanedPaintCleanup />
        </div>

        {/* Info */}
        <div className="mt-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
            Setup Checklist
          </h3>
          <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-2 list-decimal list-inside">
            <li><strong>New Users:</strong> Use "Manage Paints" → "Clear and Reseed" to import all 500+ paints</li>
            <li><strong>Existing Users:</strong> Use "Smart Import" to add new paints without duplicates</li>
            <li>Optional: Scrape paint sets from manufacturers with "Scrape Paint Sets"</li>
            <li>Optional: Import from GitHub (2000+ paints from 34 manufacturers)</li>
            <li>Run migrations to add social fields to existing data (run once)</li>
            <li>Deploy Firestore security rules: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">firebase deploy --only firestore:rules</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
