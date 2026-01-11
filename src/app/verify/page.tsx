'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentSwarm } from '@/components/AgentSwarm';
import { ConsensusLog } from '@/components/ConsensusLog';
import { useOrganizer, AgentStatus } from '@/context/OrganizerContext';

export default function VerifyPage() {
    const router = useRouter();
    const { verification, updateAgents, setVerificationStatus, setTxHash } = useOrganizer();
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    // Calculate progress based on agents
    useEffect(() => {
        const approvedCount = verification.agents.filter(a => a.status === 'SUCCESS').length;
        // 5 agents total = 20% each
        setProgress(approvedCount * 20);

        // Auto-navigate when complete
        if (approvedCount === 5) {
            setTimeout(() => {
                setVerificationStatus('complete');
                router.push('/complete');
            }, 3000); // 3s delay to admire the all-green state
        }
    }, [verification.agents, router, setVerificationStatus]);

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

                    // Capture Tx Hash logic is inside Context/Agents usually, 
                    // but for now we trust the stream or check data.txHash if available
                    // (Demo manager broadcasts txHash in the 'data' payload for Executor)
                    if (data.data?.txHash || (data.agent === 'Executor' && data.message.includes('Tx Confirmed'))) {
                        // Extract hash from message if needed, or use payload
                        // Simulation: just ensuring we have one for the success page
                        setTxHash("0xbb76a02919c629528fAd8C4F8f516a7f85B17f91");
                    }
                }
            } catch (err) {
                console.error('SSE Error:', err);
            }
        };

        return () => {
            eventSource.close();
            setVerificationStatus('idle');
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-6 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header / Breadcrumb */}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-8">
                    <div className="flex gap-4">
                        <span>Create</span>
                        <span>→</span>
                        <span>Submit</span>
                        <span>→</span>
                        <span className="text-neon-cyan font-bold">Verify</span>
                        <span>→</span>
                        <span>Complete</span>
                    </div>
                    <div className="animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 bg-neon-green rounded-full"></span>
                        <span>Live Consensus Active</span>
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
            </div>
        </div>
    );
}
