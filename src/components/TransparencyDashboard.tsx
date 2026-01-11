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
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Network</div>
                        <div className="flex items-center gap-2 text-green-400">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Sepolia Testnet
                        </div>
                    </div>
                </header>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <PrizePoolStatus amount={12500} currency="MNEE" status="LOCKED" />
                    </div>
                    <div className="living-glass-panel p-6 flex flex-col justify-center items-center text-center">
                        <div className="text-gray-400 text-xs uppercase">Time Until Next Round</div>
                        <div className="text-3xl font-mono mt-2">04:12:33</div>
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
