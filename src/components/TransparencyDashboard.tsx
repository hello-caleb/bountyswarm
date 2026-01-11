'use client';

import React, { useEffect, useState } from 'react';
import { AgentSwarm } from './AgentSwarm';
import { PrizePoolStatus } from './PrizePoolStatus';

// Mock types matching the ones in AgentSwarm
type Agent = {
    id: string;
    name: string;
    role: string;
    status: 'IDLE' | 'THINKING' | 'VOTING' | 'SUCCESS' | 'ERROR';
    message: string;
    consensusScore: number;
};

type VaultData = {
    balance: string;
    vaultAddress: string;
    vaultEtherscan: string;
};

const INITIAL_AGENTS: Agent[] = [
    { id: '1', name: 'Scout', role: 'Discovery', status: 'IDLE', message: 'Waiting for trigger...', consensusScore: 100 },
    { id: '2', name: 'Analyst', role: 'Evaluation', status: 'IDLE', message: 'Waiting for data...', consensusScore: 100 },
    { id: '3', name: 'Auditor', role: 'Security', status: 'IDLE', message: 'Vault secure.', consensusScore: 100 },
    { id: '4', name: 'Compliance', role: 'Legal', status: 'IDLE', message: 'Policy engine loaded.', consensusScore: 100 },
    { id: '5', name: 'Executor', role: 'Payout', status: 'IDLE', message: 'Wallet ready.', consensusScore: 100 },
];

export function TransparencyDashboard() {
    const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
    const [logs, setLogs] = useState<string[]>([]);
    const [vaultData, setVaultData] = useState<VaultData | null>(null);
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);

    // Fetch real vault balance from Sepolia
    useEffect(() => {
        const fetchVaultBalance = async () => {
            try {
                const res = await fetch('/api/vault/balance');
                const data = await res.json();
                if (data.balance) {
                    setVaultData(data);
                }
            } catch (err) {
                console.error('Error fetching vault balance:', err);
            }
        };

        fetchVaultBalance();
        // Refresh balance every 30 seconds
        const interval = setInterval(fetchVaultBalance, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Start listening to SSE stream
        const eventSource = new EventSource('/api/agents/status');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'UPDATE') {
                    // Update agent status
                    setAgents(prev => prev.map(agent => {
                        if (agent.name === data.agent) {
                            return {
                                ...agent,
                                status: data.status,
                                message: data.message
                            };
                        }
                        return agent;
                    }));

                    // Add to log
                    const time = new Date().toLocaleTimeString();
                    setLogs(prev => [`[${time}] ${data.agent}: ${data.message}`, ...prev].slice(0, 10));

                    // Capture transaction hash if present
                    if (data.txHash) {
                        setLastTxHash(data.txHash);
                    }
                }
            } catch (err) {
                console.error('Error parsing SSE', err);
            }
        };

        // Trigger demo scenario on mount for "End-to-End" test flow
        // In production, this would be triggered by a contract event or cron job
        fetch('/api/demo/trigger').catch(console.error);

        return () => {
            eventSource.close();
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-8 font-sans selection:bg-neon-cyan selection:text-black">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex justify-between items-end pb-6 border-b border-white/10">
                    <div>
                        <h1 className="text-5xl font-extrabold tracking-tighter mb-2">
                            Bounty<span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">Swarm</span>
                        </h1>
                        <p className="text-gray-400 max-w-xl">
                            Autonomous MNEE distribution governed by a decentralized agent swarm.
                            <br />
                            Observe the consensus process in real-time.
                        </p>
                        <a
                            href="/create"
                            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Start Interactive Demo
                            <span>→</span>
                        </a>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 text-green-400 text-xs uppercase tracking-widest bg-green-900/20 px-3 py-1 rounded-full border border-green-900/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            Sepolia Live
                        </div>
                        <a href="/create" className="text-sm font-bold bg-white text-black px-4 py-2 rounded hover:bg-neon-cyan transition-colors flex items-center gap-2">
                            Launch App
                            <span>→</span>
                        </a>
                    </div>
                </header>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <PrizePoolStatus
                            amount={vaultData ? parseFloat(vaultData.balance) : 12500}
                            currency="MNEE"
                            status="LOCKED"
                        />
                        {vaultData && (
                            <a
                                href={vaultData.vaultEtherscan}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-neon-cyan hover:underline mt-2 inline-block"
                            >
                                View Vault on Etherscan →
                            </a>
                        )}
                    </div>
                    <div className="living-glass-panel p-6 flex flex-col justify-center items-center text-center">
                        <div className="text-gray-400 text-xs uppercase">Blockchain</div>
                        <div className="text-xl font-mono mt-2 text-neon-green">LIVE</div>
                        <div className="text-xs text-gray-500 mt-1">Sepolia Testnet</div>
                        {lastTxHash && (
                            <a
                                href={`https://sepolia.etherscan.io/tx/${lastTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-neon-purple hover:underline mt-2"
                            >
                                Last Tx: {lastTxHash.slice(0, 10)}...
                            </a>
                        )}
                    </div>
                </div>

                {/* Swarm Visualization */}
                <section className="py-6">
                    <AgentSwarm agents={agents} />
                </section>

                {/* Activity Feed */}
                <section className="living-glass-panel p-6 min-h-[200px]">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Swarm Consensus Log</h3>
                    <div className="space-y-2 font-mono text-sm text-gray-300">
                        {logs.length === 0 && <span className="text-gray-500 italic">Connected to Swarm. Waiting for activity...</span>}
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-4 border-b border-white/5 pb-1">
                                {/* Simple parsing for color coding names */}
                                <span dangerouslySetInnerHTML={{
                                    __html: log.replace(
                                        /(Scout|Analyst|Auditor|Compliance|Executor)/,
                                        '<span class="text-neon-cyan">$1</span>'
                                    )
                                }} />
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
