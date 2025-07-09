export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Main Title */}
        <div className="space-y-4">
          <div className="text-8xl animate-bounce">🤖</div>
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            Oops! Wrong Door! 
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            You&apos;ve stumbled upon the secret lair of a Canvas LTI AI Assistant
          </p>
        </div>

        {/* Fun Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-l-4 border-blue-500">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📚 Looking for the AI Assistant?
          </h2>
          <p className="text-gray-600 mb-4">
            This little guy only lives inside Canvas courses! You can&apos;t access the AI assistant directly - 
            it&apos;s launched through Canvas&apos;s LTI (Learning Tools Interoperability) magic ✨
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            <strong>Pro tip:</strong> If you&apos;re a student or professor, look for the AI Assistant in your Canvas course navigation!
          </div>
        </div>

        {/* Easter Egg Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-lg font-semibold text-gray-800">Lightning Fast</div>
            <div className="text-gray-600 text-sm">Powered by Next.js 15 & OpenAI</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-2">🎓</div>
            <div className="text-lg font-semibold text-gray-800">Education First</div>
            <div className="text-gray-600 text-sm">Built for learning, not cat videos</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-2">🔐</div>
            <div className="text-lg font-semibold text-gray-800">Secure AF</div>
            <div className="text-gray-600 text-sm">LTI 1.3 with JWT validation</div>
          </div>
        </div>

        {/* Open Source Info */}
        <div className="bg-gray-800 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">🚀 Open Source Goodness</h2>
          <p className="text-gray-300 mb-4">
            Originally crafted with ❤️ for Newman University, but hey - it&apos;s MIT licensed! 
            Fork it, break it, make it better. We believe in the power of open education technology.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="bg-green-600 px-3 py-1 rounded-full">MIT License</span>
            <span className="bg-blue-600 px-3 py-1 rounded-full">TypeScript</span>
            <span className="bg-purple-600 px-3 py-1 rounded-full">Canvas LTI 1.3</span>
            <span className="bg-orange-600 px-3 py-1 rounded-full">OpenAI Integration</span>
          </div>
        </div>

        {/* Classic Internet Vibes */}
        <div className="text-center space-y-2">
          <p className="text-gray-500 text-sm">
            This page is about as useful as a chocolate teapot 🫖
          </p>
          <p className="text-gray-400 text-xs">
            But at least it&apos;s not a 404 error, right? 
          </p>
          <div className="mt-4">
            <span className="text-xs text-gray-400 font-mono">
              {"// TODO: Add more easter eggs 🥚"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
