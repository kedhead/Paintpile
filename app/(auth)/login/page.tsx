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
import { Palette, BookOpen, Users, Mail, Lock } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between relative z-20">
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
          <Button variant="outline" size="sm" className="border-amber-500/30 hover:border-amber-500 text-amber-100 hover:bg-amber-500/10">
            Sign Up
          </Button>
        </Link>
      </header>

      {/* Decorative Brush Strokes - Enhanced with glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Ambient glow */}
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-0 w-[400px] h-[300px] bg-amber-600/8 blur-[100px] rounded-full" />

        {/* Main flowing brush strokes */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[70%]"
          viewBox="0 0 1200 600"
          fill="none"
          preserveAspectRatio="xMidYMax slice"
        >
          <defs>
            <linearGradient id="brushGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4a84b" stopOpacity="0" />
              <stop offset="20%" stopColor="#d4a84b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#c49a3f" stopOpacity="0.6" />
              <stop offset="80%" stopColor="#b8892f" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d4a84b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="brushGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d4a84b" stopOpacity="0" />
              <stop offset="30%" stopColor="#c49a3f" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#b8892f" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d4a84b" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="brushGradient3" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d4a84b" stopOpacity="0" />
              <stop offset="40%" stopColor="#e5b85c" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d4a84b" stopOpacity="0" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Primary flowing curve - thicker with glow */}
          <path
            d="M-100 380 Q150 320, 350 350 C500 380, 650 300, 800 340 S1050 280, 1300 320"
            stroke="url(#brushGradient1)"
            strokeWidth="3"
            fill="none"
            filter="url(#glow)"
          />
          {/* Secondary curve */}
          <path
            d="M-50 430 Q200 380, 450 410 C600 440, 750 360, 900 400 S1100 340, 1250 380"
            stroke="url(#brushGradient2)"
            strokeWidth="2.5"
            fill="none"
            filter="url(#glow)"
          />
          {/* Tertiary accent curve */}
          <path
            d="M50 480 Q300 430, 550 460 C700 490, 850 410, 1000 450 S1150 400, 1200 420"
            stroke="url(#brushGradient3)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
          />
          {/* Extra wispy lines */}
          <path
            d="M200 500 Q400 470, 600 490 T900 460"
            stroke="url(#brushGradient2)"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
        </svg>

        {/* Scattered glowing dots */}
        <div className="absolute bottom-[25%] left-[15%] w-2 h-2 rounded-full bg-amber-400/60 shadow-[0_0_10px_rgba(212,168,75,0.5)]" />
        <div className="absolute bottom-[35%] left-[30%] w-1.5 h-1.5 rounded-full bg-amber-300/40" />
        <div className="absolute bottom-[18%] left-[45%] w-1 h-1 rounded-full bg-amber-400/50" />
        <div className="absolute bottom-[30%] right-[25%] w-2 h-2 rounded-full bg-amber-400/40 shadow-[0_0_8px_rgba(212,168,75,0.4)]" />
        <div className="absolute bottom-[22%] right-[12%] w-1.5 h-1.5 rounded-full bg-amber-300/60" />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 py-8 lg:py-0 gap-12 lg:gap-20 max-w-7xl mx-auto w-full relative z-10">

        {/* Left Side - Hero Content */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-sm text-amber-400 mb-6 shadow-[0_0_20px_rgba(212,168,75,0.15)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(212,168,75,0.8)]" />
            Manage your pile of opportunity
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Turn your Grey Plastic into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Art.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto lg:mx-0">
            The ultimate companion for miniature painters. Track your backlog, document your recipes, and share your gallery with the world.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <Link href="/signup">
              <button className="px-6 h-12 font-semibold rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-black hover:from-amber-400 hover:via-yellow-400 hover:to-amber-300 transition-all shadow-[0_0_20px_rgba(212,168,75,0.4)] hover:shadow-[0_0_30px_rgba(212,168,75,0.6)]">
                Get Started Free →
              </button>
            </Link>
            <Link href="/gallery">
              <Button variant="outline" className="px-6 h-12 border-gray-600 hover:border-amber-500/50 text-gray-300 hover:text-white">
                View Gallery
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md">
          {/* Glassmorphism Card with glow border */}
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20 rounded-2xl blur-sm" />

            <div className="relative bg-[#12121a]/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-sm text-gray-400">Sign in to continue your journey</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Input with Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      {...register('email')}
                      className="w-full pl-10 pr-4 py-3 bg-[#1a1a24] border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>

                {/* Password Input with Icon */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      {...register('password')}
                      className="w-full pl-10 pr-4 py-3 bg-[#1a1a24] border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                    />
                  </div>
                  {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Golden Gradient Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 font-semibold rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-black hover:from-amber-400 hover:via-yellow-400 hover:to-amber-300 transition-all shadow-[0_0_20px_rgba(212,168,75,0.3)] hover:shadow-[0_0_30px_rgba(212,168,75,0.5)] disabled:opacity-50"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-[#12121a] text-gray-500">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full mt-4 h-12 flex items-center justify-center gap-2 bg-[#1a1a24] border border-gray-700 rounded-lg text-gray-300 hover:border-gray-600 hover:bg-[#1f1f2a] transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="mt-6 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
                  Sign up free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Cards */}
      <section className="w-full px-6 py-12 border-t border-gray-800/50 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project Tracking */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:from-amber-500/20 group-hover:via-amber-500/10 group-hover:to-amber-500/20 rounded-xl blur-sm transition-all duration-300" />
            <div className="relative bg-[#12121a]/80 border border-gray-700/50 group-hover:border-amber-500/30 rounded-xl p-6 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                <Palette className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Project Tracking</h3>
              <p className="text-sm text-gray-400">
                Move projects from your pile of shame to completed. Track progress with visual status boards.
              </p>
            </div>
          </div>

          {/* Paint Recipes */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:via-blue-500/10 group-hover:to-blue-500/20 rounded-xl blur-sm transition-all duration-300" />
            <div className="relative bg-[#12121a]/80 border border-gray-700/50 group-hover:border-blue-500/30 rounded-xl p-6 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Paint Recipes</h3>
              <p className="text-sm text-gray-400">
                Document exactly which paints you used. Never forget how you achieved that perfect non-metallic metal.
              </p>
            </div>
          </div>

          {/* Share Gallery */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/20 group-hover:via-purple-500/10 group-hover:to-purple-500/20 rounded-xl blur-sm transition-all duration-300" />
            <div className="relative bg-[#12121a]/80 border border-gray-700/50 group-hover:border-purple-500/30 rounded-xl p-6 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Share Gallery</h3>
              <p className="text-sm text-gray-400">
                Showcase your finished miniatures. Get feedback from a community that understands the hobby.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
