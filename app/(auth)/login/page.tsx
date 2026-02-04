'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormData } from '@/lib/validation/schemas';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { Palette, BookOpen, Users } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    try {
      setError('');
      setIsLoading(true);
      await signIn(data.email, data.password);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/paintpile-logo.png"
            alt="PaintPile"
            width={140}
            height={40}
            className="h-10 w-auto"
          />
        </Link>
        <Link href="/signup">
          <Button variant="outline" size="sm" className="border-border hover:border-primary">
            Sign Up
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 py-8 lg:py-0 gap-12 lg:gap-20 max-w-7xl mx-auto w-full">

        {/* Left Side - Hero Content */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Manage your pile of opportunity
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-tight mb-6">
            Turn your Grey Plastic into{' '}
            <span className="text-primary">Art.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto lg:mx-0">
            The ultimate companion for miniature painters. Track your backlog, document your recipes, and share your gallery with the world.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <Link href="/signup">
              <Button className="px-6 h-12 font-semibold">
                Get Started Free →
              </Button>
            </Link>
            <Link href="/gallery">
              <Button variant="outline" className="px-6 h-12 border-border hover:border-primary">
                View Gallery
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md">
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl shadow-black/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
              <p className="text-sm text-muted-foreground">Sign in to continue your journey</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                error={errors.password?.message}
                {...register('password')}
                className="bg-background/50"
              />

              <div className="flex justify-end -mt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="default"
                className="w-full font-semibold h-12"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-card text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 h-12 bg-background/50 hover:bg-background/80 border-border hover:border-primary"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Cards */}
      <section className="w-full px-6 py-12 border-t border-border/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project Tracking */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Project Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Move projects from your pile of shame to completed. Track progress with visual status boards.
            </p>
          </div>

          {/* Paint Recipes */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Paint Recipes</h3>
            <p className="text-sm text-muted-foreground">
              Document exactly which paints you used. Never forget how you achieved that perfect non-metallic metal.
            </p>
          </div>

          {/* Share Gallery */}
          <div className="bg-card/50 border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Share Gallery</h3>
            <p className="text-sm text-muted-foreground">
              Showcase your finished miniatures. Get feedback from a community that understands the hobby.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
