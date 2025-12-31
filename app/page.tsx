export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Paint<span className="text-orange-500">Pile</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your miniature painting journal. From pile to painted.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg transition"
            >
              Get Started
            </a>
            <a
              href="/login"
              className="bg-white hover:bg-gray-50 text-orange-500 font-semibold px-8 py-3 rounded-lg border-2 border-orange-500 transition"
            >
              Log In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
