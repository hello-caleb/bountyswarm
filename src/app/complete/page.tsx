'use client';

import React from 'react';
import Link from 'next/link';
import { useOrganizer } from '@/context/OrganizerContext';

export default function CompletePage() {
    const { bounty, winner, verification } = useOrganizer();
    const txHash = verification.txHash;

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-6 font-sans flex items-center justify-center">
            <div className="max-w-2xl w-full">

                {/* Success Card */}
                <div className="living-glass-panel p-12 text-center relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-green/20 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-neon-green/30 animate-[pulse_3s_infinite]">
                            <svg className="w-12 h-12 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 className="text-4xl font-bold mb-2">Prize Distributed!</h1>
                        <p className="text-xl text-gray-300 mb-8">
                            <span className="text-white font-bold">{bounty.formattedAmount}</span> has been sent to the winner.
                        </p>

                        {/* Transaction Details */}
                        <div className="bg-black/40 rounded-xl p-6 mb-8 text-left border border-white/5">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-500 uppercase text-xs mb-1">To Winner</div>
                                    <div className="font-mono text-neon-cyan truncate" title={winner.address}>
                                        {winner.address.slice(0, 6)}...{winner.address.slice(-4)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-gray-500 uppercase text-xs mb-1">Project</div>
                                    <div className="font-bold">{winner.projectName}</div>
                                </div>
                                <div className="col-span-2 pt-4 border-t border-white/10 mt-2">
                                    <div className="text-gray-500 uppercase text-xs mb-1">Transaction Hash</div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-mono text-gray-300 text-xs truncate mr-4">
                                            {txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-10)}` : 'Generating...'}
                                        </span>
                                        <a
                                            href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-neon-purple hover:text-white text-xs underline"
                                        >
                                            View on Etherscan ↗
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 justify-center">
                            <Link
                                href="/create"
                                className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium border border-white/10"
                            >
                                Distribute Another
                            </Link>
                            <Link
                                href="/"
                                className="px-6 py-3 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                            >
                                Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
