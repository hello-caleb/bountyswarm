import React from 'react';
import { AgentCard } from './AgentCard';

// Mock types for now, will import real types in integration
type Agent = {
    id: string;
    name: string;
    role: string;
    status: 'IDLE' | 'THINKING' | 'VOTING' | 'SUCCESS' | 'ERROR';
    message: string;
    consensusScore: number;
};

interface AgentSwarmProps {
    agents: Agent[];
}

export function AgentSwarm({ agents }: AgentSwarmProps) {
    return (
        <div className="w-full">
            <h2 className="text-xl text-white mb-6 flex items-center gap-2">
                <span className="text-neon-cyan">●</span> SWARM INTELLIGENCE
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {agents.map((agent) => (
                    <AgentCard
                        key={agent.id}
                        name={agent.name}
                        role={agent.role}
                        status={agent.status}
                        message={agent.message}
                        consensusScore={agent.consensusScore}
                    />
                ))}
            </div>
        </div>
    );
}
