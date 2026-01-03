'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isUserAdmin } from '@/lib/auth/admin-check';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Shield, Search, Check, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserSearchResult {
  userId: string;
  email: string;
  displayName: string;
  username?: string;
  subscription?: {
    tier: 'free' | 'pro';
    status: 'active' | 'canceled' | 'past_due';
  };
  features?: {
    aiEnabled?: boolean;
  };
}

export default function ManageUsersPage() {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  async function handleSearch() {
    if (!searchEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setSearchResult(null);

    try {
      const response = await fetch('/api/admin/search-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchEmail.trim() }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to search user');
        return;
      }

      setSearchResult(result.data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Failed to search user');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUserAccess(
    userId: string,
    updates: { aiEnabled?: boolean; proTier?: boolean }
  ) {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/update-user-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates }),
      });

      const result = await response.json();

      if (!result.success) {
        const errorMsg = result.error || 'Failed to update user';
        const detailsMsg = result.details ? `\n\nDetails: ${result.details}` : '';
        setError(errorMsg + detailsMsg);
        console.error('API Error:', result);
        return;
      }

      setSuccess('User access updated successfully');
      setSearchResult(result.data);
    } catch (err: any) {
      console.error('Update error:', err);
      setError(`Failed to update user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Manage Users</h1>
          </div>
          <p className="text-muted-foreground">
            Search for users and manage their Pro subscriptions and AI feature access
          </p>
        </div>

        {/* Search User */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search User</h2>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter user email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </Card>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-lg p-4 mb-6">
            {success}
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}

        {/* Search Result */}
        {searchResult && !loading && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">User Details</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Display Name
                </label>
                <p className="text-lg">{searchResult.displayName}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-lg">{searchResult.email}</p>
              </div>

              {searchResult.username && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Username
                  </label>
                  <p className="text-lg">@{searchResult.username}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  User ID
                </label>
                <p className="text-sm font-mono text-muted-foreground">
                  {searchResult.userId}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="font-semibold mb-4">Access Control</h3>

              {/* AI Enabled Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">AI Features Enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Grant AI access without Pro subscription (for testing)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {searchResult.features?.aiEnabled ? (
                      <span className="text-green-600 dark:text-green-400">
                        Enabled
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Disabled</span>
                    )}
                  </span>
                  <Button
                    size="sm"
                    variant={searchResult.features?.aiEnabled ? 'destructive' : 'default'}
                    onClick={() =>
                      handleUpdateUserAccess(searchResult.userId, {
                        aiEnabled: !searchResult.features?.aiEnabled,
                      })
                    }
                  >
                    {searchResult.features?.aiEnabled ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Enable
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Pro Subscription Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Pro Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    Full Pro tier with AI features and quota
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {searchResult.subscription?.tier === 'pro' &&
                    searchResult.subscription?.status === 'active' ? (
                      <span className="text-green-600 dark:text-green-400">
                        Active
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Free</span>
                    )}
                  </span>
                  <Button
                    size="sm"
                    variant={
                      searchResult.subscription?.tier === 'pro' &&
                      searchResult.subscription?.status === 'active'
                        ? 'destructive'
                        : 'default'
                    }
                    onClick={() =>
                      handleUpdateUserAccess(searchResult.userId, {
                        proTier: !(
                          searchResult.subscription?.tier === 'pro' &&
                          searchResult.subscription?.status === 'active'
                        ),
                      })
                    }
                  >
                    {searchResult.subscription?.tier === 'pro' &&
                    searchResult.subscription?.status === 'active' ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Remove Pro
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Grant Pro
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Note:</strong> For testing, use "AI Features Enabled" to grant
                access without affecting subscription. For production, use "Pro
                Subscription" to grant full Pro tier access.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
