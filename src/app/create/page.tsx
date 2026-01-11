'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizer } from '@/context/OrganizerContext';
import { OrganizerSteps } from '@/components/OrganizerSteps';

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
                {/* Header/Nav - Centered above card */}
                <div className="flex flex-col items-center gap-6 text-center">
                    <h1 className="text-5xl font-extrabold tracking-tighter mb-2">
                        Bounty<span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">Swarm</span>
                    </h1>

                    <div className="w-full flex justify-center mb-4">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-8 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                            <OrganizerSteps currentStep="create" />
                        </div>
                    </div>
                </div>

                {/* Card */}
                <div className="living-glass-panel p-10 w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 bg-[#131620]/90 backdrop-blur-2xl rounded-3xl">
                    <h2 className="text-3xl font-bold mb-3 text-center text-white">Definition Phase</h2>
                    <p className="text-gray-400 mb-10 text-center text-lg">Initialize the bounty parameters for the swarm.</p>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[#00f3ff] mb-3 font-bold ml-1">Bounty Name</label>
                            <input
                                type="text"
                                className="w-full bg-black/60 border border-white/10 rounded-xl p-5 text-xl text-white focus:border-neon-cyan focus:shadow-[0_0_30px_rgba(0,243,255,0.15)] outline-none transition-all duration-300 placeholder-gray-600 focus:bg-black/80"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Global AI Hackathon"
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-[#00f3ff] mb-3 font-bold ml-1">Prize Amount</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    className="w-full bg-black/60 border border-white/10 rounded-xl p-5 text-xl text-white font-mono focus:border-neon-cyan focus:shadow-[0_0_30px_rgba(0,243,255,0.15)] outline-none transition-all duration-300 focus:bg-black/80"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold tracking-wider group-focus-within:text-neon-cyan transition-colors">MNEE</span>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full overflow-hidden rounded-xl p-[2px] focus:outline-none transition-all active:scale-[0.99]"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-purple-500 to-neon-cyan opacity-70 group-hover:opacity-100 transition-opacity duration-300 animate-gradient-x" />
                                <div className="relative bg-black h-full w-full rounded-xl flex items-center justify-center py-5 transition-all duration-300 group-hover:bg-opacity-80">
                                    {isLoading ? (
                                        <div className="flex items-center gap-3">
                                            <svg className="animate-spin h-5 w-5 text-[#00f3ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="font-bold text-white tracking-wide">INITIALIZING SWARM...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-lg text-white group-hover:text-[#00f3ff] transition-colors tracking-wide">
                                                LOCK PARAMETERS & CONTINUE
                                            </span>
                                            <span className="text-xl text-[#00f3ff] group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>
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
