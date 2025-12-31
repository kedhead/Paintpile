export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">
            Paint<span className="text-primary-400">Pile</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Your miniature painting journal. From pile to painted.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/signup"
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-lg transition shadow-lg hover:shadow-primary-500/50"
            >
              Get Started
            </a>
            <a
              href="/login"
              className="bg-white hover:bg-gray-50 text-primary-600 font-semibold px-8 py-3 rounded-lg border-2 border-primary-500 transition"
            >
              Log In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
