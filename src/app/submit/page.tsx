'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizer } from '@/context/OrganizerContext';

export default function SubmitPage() {
    const router = useRouter();
    const { bounty, winner, setWinner } = useOrganizer();

    // Local state for form validation/input
    const [formData, setFormData] = useState({
        address: winner.address || '',
        projectName: winner.projectName || '',
        projectUrl: winner.projectUrl || '',
        category: winner.category || 'AI_AGENT_PAYMENTS',
        verificationCriteria: winner.verificationCriteria || ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Save to context
        setWinner(formData);

        // Trigger the backend demo process!
        try {
            await fetch('/api/demo/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    winnerAddress: formData.address,
                    prizeAmount: bounty.amount.toString()
                })
            });

            // Navigate immediately to verify page to catch the stream
            router.push('/verify');
        } catch (err) {
            console.error(err);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-6 font-sans flex items-center justify-center">
            <div className="max-w-xl w-full">

                {/* Breadcrumb */}
                <div className="flex gap-4 text-sm text-gray-500 mb-8 justify-center">
                    <span>Create</span>
                    <span>→</span>
                    <span className="text-neon-cyan font-bold">Submit</span>
                    <span>→</span>
                    <span>Verify</span>
                    <span>→</span>
                    <span>Complete</span>
                </div>

                <div className="living-glass-panel p-8">
                    <h1 className="text-3xl font-bold mb-2">Submit Winner</h1>
                    <p className="text-gray-400 mb-8">Enter details for the selected project to begin verification.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Winner Wallet Address</label>
                            <input
                                type="text"
                                required
                                placeholder="0x..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-neon-cyan outline-none transition-colors"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none transition-colors"
                                    value={formData.projectName}
                                    onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Prize Category</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none transition-colors appearance-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="AI_AGENT_PAYMENTS">AI Agent Payments</option>
                                    <option value="COMMERCE_CREATOR">Commerce & Creator</option>
                                    <option value="PROGRAMMABLE_FINANCE">Programmable Finance</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Project Repository / URL</label>
                            <input
                                type="url"
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none transition-colors"
                                value={formData.projectUrl}
                                onChange={e => setFormData({ ...formData, projectUrl: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Verification Criteria</label>
                            <textarea
                                required
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-neon-cyan outline-none transition-colors resize-none"
                                value={formData.verificationCriteria}
                                onChange={e => setFormData({ ...formData, verificationCriteria: e.target.value })}
                                placeholder="- Check for compilation errors&#10;- Verify MNEE token usage&#10;- Ensure unit tests pass"
                            />
                            <p className="text-xs text-gray-500 mt-1">Agents will use these rules to evaluate the submission.</p>
                        </div>

                        {/* Read-only Context Data */}
                        <div className="p-4 bg-neon-purple/10 border border-neon-purple/30 rounded-lg flex justify-between items-center">
                            <span className="text-neon-purple text-sm font-bold">Prize Allocation</span>
                            <span className="font-mono text-xl">{bounty.formattedAmount}</span>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-bold py-4 rounded-lg hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,243,255,0.2)] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Initiating Swarm...</span>
                                </div>
                            ) : (
                                'Begin Agent Verification →'
                            )}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
}
