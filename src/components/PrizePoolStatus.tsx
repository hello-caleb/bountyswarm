import React from 'react';

interface PrizePoolStatusProps {
    amount: number;
    currency: string;
    status: 'LOCKED' | 'DISTRIBUTING' | 'PAID';
}

export function PrizePoolStatus({ amount, currency, status }: PrizePoolStatusProps) {
    return (
        <div className="living-glass-panel p-6 flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">Total Prize Pool</p>
                <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-mono">
                    {amount.toLocaleString()} <span className="text-lg text-neon-cyan">{currency}</span>
                </div>
            </div>

            <div className="text-right">
                <div className="text-xs text-gray-500 uppercase mb-2">Vault Status</div>
                <span className={`
          px-3 py-1 rounded-full text-xs font-bold tracking-wider
          ${status === 'LOCKED' ? 'bg-gray-800 text-gray-300 border border-gray-600' : ''}
          ${status === 'DISTRIBUTING' ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple' : ''}
          ${status === 'PAID' ? 'bg-neon-green/20 text-neon-green border border-neon-green' : ''}
        `}>
                    {status}
                </span>
            </div>
        </div>
    );
}
