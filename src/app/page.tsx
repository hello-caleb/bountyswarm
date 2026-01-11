'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizer } from '@/context/OrganizerContext';

export default function Home() {
    const router = useRouter();
    const { setBounty } = useOrganizer();

    const [name, setName] = useState('MNEE Hackathon 2026');
    const [amount, setAmount] = useState(12500);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setBounty({ name, amount });
        router.push('/submit');
    };

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-6 font-sans flex items-center justify-center">
            <div className="max-w-xl w-full">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-extrabold tracking-tighter mb-2">
                        Bounty<span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">Swarm</span>
                    </h1>
                    <p className="text-gray-400">
                        Autonomous prize distribution in under 60 seconds.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-green-400 text-xs uppercase tracking-widest mt-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        Sepolia Testnet Live
                    </div>
                </div>

                {/* Breadcrumb */}
                <div className="flex gap-4 text-sm text-gray-500 mb-8 justify-center">
                    <span className="text-neon-cyan font-bold">Create</span>
                    <span>→</span>
                    <span>Submit</span>
                    <span>→</span>
                    <span>Verify</span>
                    <span>→</span>
                    <span>Complete</span>
                </div>

                <div className="living-glass-panel p-8">
                    <h2 className="text-3xl font-bold mb-2">Create New Bounty</h2>
                    <p className="text-gray-400 mb-8">Setup a prize pool for autonomous distribution.</p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Bounty Name</label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-lg text-white focus:border-neon-cyan outline-none transition-colors"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Prize Amount</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-lg text-white font-mono focus:border-neon-cyan outline-none transition-colors"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">MNEE</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-bold py-4 rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
                        >
                            Continue to Winner Selection
                            <span>→</span>
                        </button>
                    </form>
                </div>

                {/* Footer link to dashboard */}
                <div className="text-center mt-6">
                    <a href="/dashboard" className="text-gray-500 text-sm hover:text-neon-cyan transition-colors">
                        View Transparency Dashboard →
                    </a>
                </div>

            </div>
        </div>
    );
}
