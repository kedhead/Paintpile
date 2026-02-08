'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormData } from '@/lib/validation/schemas';
import Link from 'next/link';
import Image from 'next/image';
import PaintSplatterBackground from '@/components/ui/PaintSplatterBackground';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-[#1a1a1f] flex flex-col items-center justify-center relative overflow-hidden">

      {/* Background Ambience - Paint Splatters */}
      <PaintSplatterBackground />

      {/* Main Content - Centered */}
      <div className="relative z-10 w-full max-w-[500px] px-6 animate-in fade-in zoom-in duration-500">

        {/* Glassmorphism Login Card */}
        <div className="relative group">
          {/* Card Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-b from-amber-500/20 via-transparent to-amber-500/10 rounded-[32px] blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative bg-[#2a2a30]/70 backdrop-blur-2xl border border-amber-500/20 rounded-[28px] p-10 shadow-2xl">

            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24 hover:scale-105 transition-transform duration-300">
                <Image
                  src="/images/paintpile-logo-main.png"
                  alt="PaintPile"
                  fill
                  className="object-contain"
                  style={{
                    filter: 'sepia(1) saturate(3) hue-rotate(15deg) brightness(0.9) drop-shadow(0 0 15px rgba(245, 158, 11, 0.3))'
                  }}
                  priority
                />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-8 space-y-2">
              <h2 className="text-gray-400 font-medium tracking-wide uppercase text-sm">Welcome Back</h2>
              <h1 className="text-3xl font-serif font-medium bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                Login to your creative journey
              </h1>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Email Input */}
              <div className="group/input">
                <input
                  type="email"
                  placeholder="Email Address"
                  {...register('email')}
                  className="w-full px-5 py-4 bg-[#1a1a1f]/60 border border-amber-500/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 transition-all font-medium group-hover/input:border-amber-500/40"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-2 pl-1 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="group/input">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    {...register('password')}
                    className="w-full px-5 py-4 bg-[#1a1a1f]/60 border border-amber-500/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/50 transition-all pr-16 font-medium group-hover/input:border-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-amber-400 transition-colors font-medium px-2 py-1"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-2 pl-1 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs text-gray-500 hover:text-amber-400 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-600 hover:to-amber-700 text-black font-bold text-lg rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.3)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-[#232329] px-3 text-gray-500 font-medium rounded-full">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-4 bg-[#1a1a1f]/80 hover:bg-[#202025] border border-amber-500/20 hover:border-amber-500/40 text-gray-200 font-medium rounded-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group/google"
              >
                <div className="p-1 bg-white rounded-full group-hover/google:scale-110 transition-transform">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <span className="group-hover/google:text-white transition-colors">Sign in with Google</span>
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-gray-400 pt-4">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="text-amber-400 hover:text-amber-300 font-semibold transition-colors hover:underline decoration-amber-400/30 underline-offset-4"
                >
                  Create an account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 left-0 right-0 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-forwards opacity-0">
        <p className="text-xs text-gray-500 font-medium tracking-wide">
          © {new Date().getFullYear()} PaintPile. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
