'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { signupSchema, type SignupFormData } from '@/lib/validation/schemas';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';

export default function SignupPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupFormData) {
    if (!acceptedTerms) {
      setError('You must accept the Terms of Service to create an account.');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await signUp(data.email, data.password, data.displayName);
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else {
        setError('Failed to create account. Please try again.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!acceptedTerms) {
      setError('You must accept the Terms of Service to create an account.');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to sign in with Google.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="relative w-full max-w-4xl h-64 mb-8">
        <Image
          src="/paintpile-logo.png"
          alt="PaintPile Logo"
          fill
          className="object-contain"
          priority
        />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-display text-muted-foreground">
            Join the community
          </h2>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-primary">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Display Name"
                type="text"
                placeholder="John Doe"
                error={errors.displayName?.message}
                {...register('displayName')}
                className="bg-background/50"
              />

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
                className="bg-background/50"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                helperText="At least 6 characters"
                error={errors.password?.message}
                {...register('password')}
                className="bg-background/50"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                className="bg-background/50"
              />

              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
                  I agree to the <Link href="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>,
                  confirming I will use this platform for miniature painting content only (no adult content).
                </label>
              </div>

              <Button
                type="submit"
                variant="default"
                className="w-full font-semibold"
                isLoading={isLoading}
                disabled={!acceptedTerms}
              >
                Sign Up
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 bg-background/50 hover:bg-background/80 border-border hover:text-primary"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
