import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col items-center space-y-12">
        {/* Large Logo */}
        <div className="relative w-full h-64 md:h-80 animate-in fade-in zoom-in duration-1000">
          <Image
            src="/paintpile-logo.png"
            alt="PaintPile"
            fill
            className="object-contain"
            priority
          />
        </div>

        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground tracking-tight drop-shadow-md">
            From Pile to <span className="text-primary">Painted</span>
          </h1>

          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            The ultimate companion for your miniature painting journey.
            Track your backlog, document your recipes, and share your gallery with the world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 font-bold shadow-[0_0_20px_-5px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)] transition-all">
                Start Your Journey
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14 bg-background/50 backdrop-blur-sm border-2">
                Continue Journal
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer / Credits */}
      <div className="absolute bottom-6 text-sm text-muted-foreground/50">
        <p>© {new Date().getFullYear()} PaintPile. All rights reserved.</p>
      </div>
    </div>
  );
}
