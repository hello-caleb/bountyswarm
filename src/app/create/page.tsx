'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizer } from '@/context/OrganizerContext';

export default function CreatePage() {
    const router = useRouter();
    const { setBounty } = useOrganizer();

    const [name, setName] = useState('MNEE Hackathon 2026');
    const [amount, setAmount] = useState(12500);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setBounty({ name, amount }); // Context handles formatting
        router.push('/submit');
    };

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-6 font-sans flex flex-col items-center justify-center">

            {/* Centered Container for Alignment */}
            <div className="w-full max-w-lg space-y-8">

                {/* Header/Nav - Centered above card */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tighter">
                        Bounty<span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">Swarm</span>
                    </h1>
                    <p className="text-gray-400 text-sm">Autonomous prize distribution in under 60 seconds.</p>

                    <div className="flex items-center gap-2 text-green-400 text-xs uppercase tracking-widest bg-green-900/20 px-3 py-1 rounded-full border border-green-900/50 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        Sepolia Testnet Live
                    </div>

                    <div className="flex gap-4 text-sm text-gray-500 justify-center w-full">
                        <span className="text-neon-cyan font-bold transition-colors">Create</span>
                        <span>→</span>
                        <span className="hover:text-gray-300 transition-colors">Submit</span>
                        <span>→</span>
                        <span className="hover:text-gray-300 transition-colors">Verify</span>
                        <span>→</span>
                        <span className="hover:text-gray-300 transition-colors">Complete</span>
                    </div>
                </div>

                {/* Card */}
                <div className="living-glass-panel p-8 w-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10">
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
                            className="w-full bg-white hover:bg-neon-cyan text-black font-extrabold text-lg py-5 rounded-lg transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,243,255,0.23)] hover:-translate-y-1 flex justify-center items-center gap-2"
                        >
                            Continue to Winner Selection
                            <span>→</span>
                        </button>
                    </form>
                </div>

                <div className="text-center">
                    <a href="/" className="text-gray-500 hover:text-white text-sm transition-colors">
                        View Transparency Dashboard →
                    </a>
                </div>

            </div>
        </div>
    );
}
