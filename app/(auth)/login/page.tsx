'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { loginSchema, type LoginFormData } from '@/lib/validation/schemas';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Animated paint blob component
function PaintBlob({ color, size, x, y, delay, duration }: {
  color: string; size: number; x: string; y: string; delay: number; duration: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        background: color,
        width: size,
        height: size,
        left: x,
        top: y,
        filter: `blur(${size * 0.6}px)`,
        opacity: 0.35,
      }}
      animate={{
        x: [0, 30, -20, 10, 0],
        y: [0, -25, 15, -10, 0],
        scale: [1, 1.15, 0.9, 1.05, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// Floating paint drip
function PaintDrip({ color, left, delay }: { color: string; left: string; delay: number }) {
  return (
    <motion.div
      className="absolute top-0 pointer-events-none"
      style={{ left }}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: -20, opacity: 1 }}
      transition={{ duration: 1.5, delay, ease: 'easeOut' }}
    >
      <svg width="24" height="80" viewBox="0 0 24 80" fill="none">
        <path
          d="M12 0 C12 0 12 40 12 50 C12 60 4 65 4 70 C4 76 8 80 12 80 C16 80 20 76 20 70 C20 65 12 60 12 50 C12 40 12 0 12 0Z"
          fill={color}
          fillOpacity="0.7"
        />
      </svg>
    </motion.div>
  );
}

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
    <div className="min-h-screen bg-[#0f0f14] flex items-center justify-center relative overflow-hidden">

      {/* Animated paint blob background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large ambient blobs */}
        <PaintBlob color="#D97706" size={300} x="10%" y="20%" delay={0} duration={20} />
        <PaintBlob color="#DC2626" size={200} x="70%" y="60%" delay={2} duration={18} />
        <PaintBlob color="#2563EB" size={250} x="60%" y="10%" delay={4} duration={22} />
        <PaintBlob color="#16A34A" size={180} x="20%" y="70%" delay={1} duration={19} />
        <PaintBlob color="#9333EA" size={160} x="80%" y="30%" delay={3} duration={21} />
        <PaintBlob color="#EC4899" size={140} x="40%" y="85%" delay={5} duration={17} />
        <PaintBlob color="#F59E0B" size={120} x="85%" y="80%" delay={2.5} duration={23} />

        {/* Paint drips from top */}
        <PaintDrip color="#D97706" left="15%" delay={0.5} />
        <PaintDrip color="#DC2626" left="35%" delay={1.2} />
        <PaintDrip color="#2563EB" left="55%" delay={0.8} />
        <PaintDrip color="#16A34A" left="75%" delay={1.5} />
        <PaintDrip color="#9333EA" left="90%" delay={0.3} />

        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Dark vignette for readability */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,15,20,0.6)_70%,rgba(15,15,20,0.9)_100%)]" />
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 w-full max-w-md px-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Login card */}
        <div className="relative">
          {/* Card border glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-amber-500/30 via-amber-500/5 to-amber-500/15" />

          <div className="relative bg-[#1a1a22]/80 backdrop-blur-xl rounded-2xl p-8 shadow-[0_0_60px_-15px_rgba(217,119,6,0.15)]">

            {/* Logo & brand */}
            <motion.div
              className="flex flex-col items-center mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative w-20 h-20 mb-4">
                <Image
                  src="/images/paintpile-logo-main.png"
                  alt="PaintPile"
                  fill
                  className="object-contain drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  priority
                />
              </div>
              <h1 className="font-display text-2xl text-white tracking-wide">
                Paint<span className="text-amber-400">Pile</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1 font-medium tracking-wide">
                Pull up a chair. Grab a brush.
              </p>
            </motion.div>

            {/* Error message */}
            {error && (
              <motion.div
                className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* Email */}
              <div>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <input
                    type="email"
                    placeholder="Email address"
                    {...register('email')}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    {...register('password')}
                    className="w-full pl-10 pr-16 py-3 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tracking-widest text-gray-500 hover:text-amber-400 transition-colors font-bold px-1.5 py-0.5 rounded bg-white/[0.04]"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1.5 pl-1">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs text-gray-500 hover:text-amber-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm rounded-lg shadow-[0_2px_20px_rgba(245,158,11,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </motion.button>

              {/* Divider */}
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-[10px] uppercase tracking-[0.2em] text-gray-600 bg-[#1a1a22]">
                    or
                  </span>
                </div>
              </div>

              {/* Google sign in */}
              <motion.button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-gray-300 text-sm font-medium rounded-lg flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </motion.button>

              {/* Sign up link */}
              <p className="text-center text-sm text-gray-500 pt-2">
                New to the table?{' '}
                <Link
                  href="/signup"
                  className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                >
                  Join the crew
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-600 mt-6 tracking-wide">
          &copy; {new Date().getFullYear()} PaintPile
        </p>
      </motion.div>
    </div>
  );
}
