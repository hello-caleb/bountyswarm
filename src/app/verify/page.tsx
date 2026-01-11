'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentSwarm } from '@/components/AgentSwarm';
import { ConsensusLog } from '@/components/ConsensusLog';
import { useOrganizer, AgentStatus } from '@/context/OrganizerContext';
import { OrganizerSteps } from '@/components/OrganizerSteps';

export default function VerifyPage() {
    const router = useRouter();
    const { verification, updateAgents, setVerificationStatus, setTxHash } = useOrganizer();
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    // Calculate progress based on agents
    // Calculate progress based on agents
    useEffect(() => {
        const approvedCount = verification.agents.filter(a => a.status === 'SUCCESS').length;
        // 5 agents total = 20% each
        setProgress(approvedCount * 20);
    }, [verification.agents]);

    useEffect(() => {
        // Start listening to SSE stream
        const eventSource = new EventSource('/api/agents/status');
        setVerificationStatus('in-progress');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'UPDATE') {
                    // Update agents via Context
                    updateAgents(verification.agents.map(agent => {
                        if (agent.name === data.agent) {
                            // Map incoming status string to our type
                            let status: AgentStatus = 'IDLE';
                            if (data.status === 'THINKING') status = 'THINKING';
                            else if (data.status === 'SUCCESS' || data.status === 'APPROVED') status = 'SUCCESS';
                            else if (data.status === 'FAILED' || data.status === 'ERROR') status = 'ERROR';

                            return {
                                ...agent,
                                status,
                                message: data.message
                            };
                        }
                        return agent;
                    }));

                    // Add log entry
                    const time = new Date().toLocaleTimeString();
                    setLogs(prev => [`[${time}] ${data.agent}: ${data.message}`, ...prev]);

                    // Capture Tx Hash from Payload (Real Truth from Blockchain)
                    if (data.agent === 'Executor' && data.data?.txHash) {
                        setTxHash(data.data.txHash);
                    }
                }
            } catch (err) {
                console.error('SSE Error:', err);
            }
        };

        return () => {
            eventSource.close();
        };
    }, []);

    // Strict Navigation Logic: Wait for All Agents + Tx Hash
    useEffect(() => {
        const allAgentsSuccess = verification.agents.every(a => a.status === 'SUCCESS');
        const hasTxHash = !!verification.txHash;

        if (allAgentsSuccess && hasTxHash) {
            setTimeout(() => {
                setVerificationStatus('complete');
                router.push('/complete');
            }, 2000);
        }
    }, [verification.agents, verification.txHash, router, setVerificationStatus]);

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-6 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header / Breadcrumb */}
                <div className="flex justify-between items-center text-sm mb-8">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-2">
                        <OrganizerSteps currentStep="verify" />
                    </div>

                    <div className="flex items-center gap-3 bg-neon-green/10 px-4 py-2 rounded-full border border-neon-green/30 shadow-[0_0_15px_rgba(0,255,100,0.1)]">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
                        </span>
                        <span className="text-neon-green font-bold tracking-wide text-xs uppercase">Live Consensus Active</span>
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold tracking-tighter mb-2">
                        Verifying Winner Eligibility
                    </h1>
                    <p className="text-gray-400">
                        Swarm Agents are analyzing submission against the rubric.
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Agents Visualization (Takes up 2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <AgentSwarm agents={verification.agents} />

                        {/* Progress Bar */}
                        <div className="living-glass-panel p-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-300">Consensus Progress</span>
                                <span className="text-neon-cyan font-mono">{progress}%</span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Logs (Takes up 1 col) */}
                    <div className="lg:col-span-1">
                        <ConsensusLog logs={logs} />
                    </div>
                </div>
            </div >
        </div >
    );
}
