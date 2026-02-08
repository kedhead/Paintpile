import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  Boxes,
  ChefHat,
  Shield,
  Book,
  Sparkles,
  Wand2,
  Palette,
  Users,
  Search,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    title: 'Collection Tracking',
    description: 'Track your entire miniature collection from pile of shame to fully painted.',
    icon: Boxes,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Smart Paint Recipes',
    description: 'Create, share, and discover paint recipes. AI finds color matches and mixing ratios.',
    icon: ChefHat,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    title: 'Army Management',
    description: 'Organize models into armies. Track progress, points, and completion status.',
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  {
    title: 'Paint Diary',
    description: 'Journal your painting journey. Log techniques, time spent, and improvements.',
    icon: Book,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    title: 'AI Paint Critic',
    description: 'Get instant feedback on technique, contrast, and color theory from our AI.',
    icon: Sparkles,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Scheme Visualizer',
    description: 'Visualize color schemes on your minis before you paint. Test ideas instantly.',
    icon: Wand2,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    title: 'Snap & Match',
    description: 'Match colors from photos to your paint inventory. Never guess a color again.',
    icon: Palette,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    title: 'Community',
    description: 'Share your work, get inspired, and join painting challenges with other hobbyists.',
    icon: Users,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    title: 'Paint Database',
    description: 'Explore 200+ paints from all major brands. Find equivalents across ranges.',
    icon: Search,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1a1a1f] flex flex-col items-center font-sans selection:bg-amber-500/30">

      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center px-4 pt-16 sm:pt-24 md:pt-32 pb-12 sm:pb-16 relative overflow-hidden">
        <div className="w-full max-w-4xl flex flex-col items-center space-y-10 relative z-10">
          {/* Logo */}
          <div className="relative w-full h-32 sm:h-48 md:h-64 animate-in fade-in zoom-in duration-1000">
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
              From Pile to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600">Painted</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed">
              The ultimate companion for your miniature painting journey.
              Track your backlog, document your recipes, and share your gallery with the world.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
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
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
            Everything you need at the <span className="text-amber-400">paint table</span>
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
            Tools built by hobbyists, for hobbyists. No fluff.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] p-5 sm:p-6 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${feature.bg} shrink-0`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm sm:text-base mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to tackle the pile?
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Join painters who are getting more done and stressing less about their backlog.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 h-12 bg-gradient-to-r from-[#D4A84B] to-[#B8862E] hover:brightness-110 text-black font-bold rounded-xl shadow-[0_4px_20px_rgba(212,168,75,0.2)] transition-all transform active:scale-[0.98] border-t border-white/20 gap-2">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-8 text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} PaintPile. All rights reserved.</p>
      </footer>
    </div>
  );
}
