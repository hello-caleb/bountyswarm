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
        <div className="min-h-screen bg-[#0f111a] text-white p-6 font-sans flex items-center justify-center">
            <div className="max-w-xl w-full">

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
                    <h1 className="text-3xl font-bold mb-2">Create New Bounty</h1>
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
                            className="w-full bg-white text-black font-bold py-4 rounded-lg hover:bg-neon-cyan hover:text-black transition-colors flex justify-center items-center gap-2"
                        >
                            Continue to Winner Selection
                            <span>→</span>
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
