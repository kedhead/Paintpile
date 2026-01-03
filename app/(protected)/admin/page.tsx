'use client';

import Link from 'next/link';
import { Shield, Database, Palette, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminPage() {
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

          {/* Manage Paint Database */}
          <Link href="/admin/manage-paints">
            <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Manage Paint Database
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clear existing paints or seed comprehensive database with 300+ paints including Army Painter Fanatic
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
        </div>

        {/* Info */}
        <div className="mt-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
            Setup Checklist
          </h3>
          <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-2 list-decimal list-inside">
            <li>Seed the paint database with 300+ paints (recommended: use "Clear and Reseed" if you have old data)</li>
            <li>Optional: Import additional paints from CSV files (web scraping or manual data entry)</li>
            <li>Run migrations to add social fields to existing data (run once)</li>
            <li>Deploy Firestore security rules: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">firebase deploy --only firestore:rules</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
