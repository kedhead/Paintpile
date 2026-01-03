'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield } from 'lucide-react';

export default function AdminDebugPage() {
  const { currentUser } = useAuth();
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function checkToken() {
    if (!currentUser) {
      alert('Not signed in');
      return;
    }

    setLoading(true);
    try {
      // Get fresh token
      const token = await currentUser.getIdToken(true);
      console.log('Token:', token);

      // Get token result with claims
      const tokenResult = await currentUser.getIdTokenResult(true);
      console.log('Token Result:', tokenResult);

      setTokenInfo({
        claims: tokenResult.claims,
        hasAdminClaim: tokenResult.claims.admin === true,
        userId: currentUser.uid,
        email: currentUser.email,
        issuedAt: tokenResult.issuedAtTime,
        expirationTime: tokenResult.expirationTime,
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Error getting token: ' + error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Token Debug</h1>
          </div>
          <p className="text-muted-foreground">
            Check if your Firebase Auth token contains the admin custom claim
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          <div className="space-y-2">
            <p><strong>Email:</strong> {currentUser?.email || 'Not signed in'}</p>
            <p><strong>UID:</strong> {currentUser?.uid || 'N/A'}</p>
          </div>

          <Button onClick={checkToken} disabled={loading || !currentUser} className="mt-4">
            {loading ? 'Checking...' : 'Check Token & Claims'}
          </Button>
        </Card>

        {tokenInfo && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Token Information</h2>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Admin Status:</h3>
              <div className={`p-4 rounded ${tokenInfo.hasAdminClaim ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
                {tokenInfo.hasAdminClaim ? (
                  <p>✅ <strong>Admin claim found!</strong> You have admin access.</p>
                ) : (
                  <p>❌ <strong>No admin claim found!</strong> You need to run the grant-admin script.</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Custom Claims:</h3>
              <pre className="bg-muted p-4 rounded overflow-x-auto text-sm">
                {JSON.stringify(tokenInfo.claims, null, 2)}
              </pre>
            </div>

            <div className="space-y-2 text-sm">
              <p><strong>User ID:</strong> {tokenInfo.userId}</p>
              <p><strong>Email:</strong> {tokenInfo.email}</p>
              <p><strong>Issued At:</strong> {tokenInfo.issuedAt}</p>
              <p><strong>Expires:</strong> {tokenInfo.expirationTime}</p>
            </div>

            {!tokenInfo.hasAdminClaim && (
              <div className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-500/20 rounded">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  How to Fix:
                </h3>
                <ol className="text-sm text-yellow-700 dark:text-yellow-300 list-decimal list-inside space-y-1">
                  <li>Run: <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">npx tsx scripts/grant-admin.ts {tokenInfo.userId}</code></li>
                  <li>Sign out and sign back in</li>
                  <li>Click "Check Token & Claims" again to verify</li>
                </ol>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
