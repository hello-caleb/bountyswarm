export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold mb-4">BountySwarm</h1>
        <p className="text-xl text-slate-300 mb-8">
          AI-powered prize distribution with cryptographic verification
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10">
            <h2 className="text-xl font-semibold mb-2">🤖 Agent Swarm</h2>
            <p className="text-slate-400">
              5 specialized agents reaching consensus on prize distribution
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10">
            <h2 className="text-xl font-semibold mb-2">🔗 On-Chain</h2>
            <p className="text-slate-400">
              MNEE token escrow with transparent verification
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 backdrop-blur border border-white/10">
            <h2 className="text-xl font-semibold mb-2">📊 Real-Time</h2>
            <p className="text-slate-400">
              Live dashboard showing agent deliberations
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
