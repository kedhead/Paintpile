import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0E0E12] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-amber-500/30">

      {/* Background Image - Matching Login Page */}
      {/* Background Image - Matching Login Page */}
      <div
        className="absolute inset-0 z-0"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
        }}
      >
        <Image
          src="/login-bg-v4.png"
          alt="Abstract decorative background"
          fill
          className="object-cover object-bottom min-[2000px]:object-contain"
          priority
          quality={100}
        />
        {/* Mobile Gradient: Top/Bottom darkness for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 lg:hidden" />

        {/* Desktop Gradients: Subtle overlay */}
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
      </div>

      <div className="w-full max-w-4xl flex flex-col items-center space-y-12 relative z-10">
        {/* Large Logo */}
        <div className="relative w-full h-48 md:h-64 animate-in fade-in zoom-in duration-1000">
          <Image
            src="/paintpile-logo.png"
            alt="PaintPile"
            fill
            className="object-contain drop-shadow-[0_0_25px_rgba(217,119,6,0.3)]"
            priority
          />
        </div>

        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1] drop-shadow-lg">
            From Pile to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.3)]">Painted</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed drop-shadow-md">
            The ultimate companion for your miniature painting journey.
            Track your backlog, document your recipes, and share your gallery with the world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 bg-gradient-to-r from-[#D4A84B] to-[#B8862E] hover:brightness-110 text-black font-bold rounded-xl shadow-[0_4px_20px_rgba(212,168,75,0.2)] transition-all transform active:scale-[0.98] border-t border-white/20">
                Start Your Journey
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14 bg-black/40 backdrop-blur-md border border-amber-500/30 text-amber-200 hover:bg-amber-500/10 hover:text-amber-100 hover:border-amber-500/50 rounded-xl transition-all">
                Continue Journal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer / Credits */}
      <div className="mt-12 md:absolute md:bottom-6 text-sm text-gray-500 relative z-10">
        <p>© {new Date().getFullYear()} PaintPile. All rights reserved.</p>
      </div>
    </div>
  );
}
