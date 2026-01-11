'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizer } from '@/context/OrganizerContext';

export default function CreatePage() {
    const router = useRouter();
    const { setBounty } = useOrganizer();

    const [name, setName] = useState('MNEE Hackathon 2026');
    const [amount, setAmount] = useState(12500);

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setBounty({ name, amount });
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
                <div className="living-glass-panel p-8 w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 bg-[#131620]/80 backdrop-blur-xl rounded-2xl">
                    <h2 className="text-3xl font-bold mb-2 text-center">Create New Bounty</h2>
                    <p className="text-gray-400 mb-8 text-center">Setup a prize pool for autonomous distribution.</p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold ml-1">Bounty Name</label>
                            <input
                                type="text"
                                className="w-full bg-black/50 border-2 border-white/5 rounded-xl p-4 text-lg text-white focus:border-neon-cyan focus:shadow-[0_0_20px_rgba(0,243,255,0.2)] outline-none transition-all duration-300 placeholder-gray-700"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Global AI Hackathon"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold ml-1">Prize Amount</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full bg-black/50 border-2 border-white/5 rounded-xl p-4 text-lg text-white font-mono focus:border-neon-cyan focus:shadow-[0_0_20px_rgba(0,243,255,0.2)] outline-none transition-all duration-300"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold tracking-wider">MNEE</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#00f3ff] hover:bg-[#00c2cc] text-black font-black text-xl py-5 rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(0,243,255,0.4)] hover:shadow-[0_0_50px_rgba(0,243,255,0.6)] hover:-translate-y-1 flex justify-center items-center gap-2 disabled:opacity-50 disabled:grayscale transform active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Creating...</span>
                                </div>
                            ) : (
                                <>
                                    CONTINUE TO SELECTION
                                    <span className="text-2xl">→</span>
                                </>
                            )}
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
