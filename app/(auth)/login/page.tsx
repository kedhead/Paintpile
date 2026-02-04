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
import { Palette, BookOpen, Users, Mail, Lock, Check } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0E0E12] flex flex-col relative overflow-hidden font-sans selection:bg-amber-500/30">

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/login-bg-v4.png"
          alt="Abstract decorative background"
          fill
          className="object-cover object-bottom"
          priority
          quality={100}
        />
        {/* Mobile Gradient: Top/Bottom darkness for text/card readability, clear middle */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 lg:hidden" />

        {/* Desktop Gradients: Stronger contrast for split layout */}
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <header className="w-full px-6 lg:px-12 py-6 flex items-center justify-between relative z-20">
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
          <Button variant="outline" size="sm" className="border-amber-500/20 hover:border-amber-500 text-amber-200 hover:text-amber-100 hover:bg-amber-500/10 font-medium tracking-wide">
            Sign Up
          </Button>
        </Link>
      </header>

      {/* Content Container */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 lg:px-12 py-8 gap-12 lg:gap-24 relative z-10 max-w-[1440px] mx-auto w-full">

        {/* Left Side */}
        <div className="flex-1 max-w-xl text-center lg:text-left space-y-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1F]/80 border border-amber-500/20 backdrop-blur-sm shadow-[0_0_15px_rgba(217,119,6,0.1)]">
            <span className="text-lg">🎨</span>
            <span className="text-sm font-medium text-gray-200">Manage your pile of opportunity</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
              Turn your <br />
              Grey Plastic <br />
              into <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.3)]">Art.</span>
            </h1>
          </div>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-lg mx-auto lg:mx-0 font-light">
            The ultimate companion for miniature painters. <br className="hidden lg:block" />
            Track your backlog, document your recipes, and <br className="hidden lg:block" />
            share your gallery with the world.
          </p>


        </div>

        {/* Right Side - Login Card */}
        <div className="w-full max-w-[440px]">
          <div className="relative group">
            {/* Card Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-b from-amber-500/10 to-transparent rounded-[32px] blur-xl opacity-50" />

            <div className="relative bg-[#18181B]/70 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 lg:p-10 shadow-2xl ring-1 ring-white/5">

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Welcome Back</h2>
                <p className="text-gray-400 text-sm">Sign in to continue your journey</p>
              </div>

              {error && (
                <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                <div className="space-y-1.5">
                  <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/input:text-amber-400 transition-colors" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      {...register('email')}
                      className="w-full pl-12 pr-4 py-3.5 bg-[#0E0E12]/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs pl-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="relative group/input">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/input:text-amber-400 transition-colors" />
                    <input
                      type="password"
                      placeholder="Password"
                      {...register('password')}
                      className="w-full pl-12 pr-4 py-3.5 bg-[#0E0E12]/50 border border-gray-700/50 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-xs text-gray-500 hover:text-white hover:bg-transparent">
                        Show
                      </Button>
                    </div>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs pl-1">{errors.password.message}</p>}
                  <div className="flex justify-end pt-1">
                    <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-white transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#D4A84B] to-[#B8862E] hover:brightness-110 text-black font-bold rounded-xl shadow-[0_4px_20px_rgba(212,168,75,0.2)] transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border-t border-white/20"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#18181B] px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-[#27272A] hover:bg-[#323238] border border-gray-700/50 text-white font-medium rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </button>

                <p className="text-center text-sm text-gray-500 pt-2">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-[#D4A84B] hover:text-[#E5B85C] font-semibold transition-colors">
                    Sign up free
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-12 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1 */}
          <div className="group bg-[#18181B]/40 border border-amber-500/40 rounded-2xl p-6 hover:bg-[#18181B]/60 transition-colors shadow-[0_0_15px_rgba(217,119,6,0.05)]">
            <div className="w-12 h-12 rounded-xl bg-[#27272A] border border-white/5 flex items-center justify-center mb-4 text-amber-500 group-hover:scale-105 transition-transform">
              <Palette className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Project Tracking</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Organize your miniature projects by stage, deadline, and priority.</p>
          </div>

          {/* Card 2 */}
          <div className="group bg-[#18181B]/40 border border-white/5 rounded-2xl p-6 hover:bg-[#18181B]/60 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#27272A] border border-white/5 flex items-center justify-center mb-4 text-gray-400 group-hover:text-amber-500 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Paint Recipes</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Save and share your unique color combinations and painting steps.</p>
          </div>

          {/* Card 3 */}
          <div className="group bg-[#18181B]/40 border border-white/5 rounded-2xl p-6 hover:bg-[#18181B]/60 hover:border-white/10 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#27272A] border border-white/5 flex items-center justify-center mb-4 text-gray-400 group-hover:text-amber-500 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Share Gallery</h3>
            <p className="text-sm text-gray-400 leading-relaxed">Showcase your completed models to the community and get feedback.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
