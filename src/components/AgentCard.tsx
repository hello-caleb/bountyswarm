import React from 'react';
import { motion } from 'framer-motion';

type AgentStatus = 'IDLE' | 'THINKING' | 'VOTING' | 'SUCCESS' | 'ERROR';

interface AgentCardProps {
    name: string;
    role: string;
    status: AgentStatus;
    message?: string;
    consensusScore?: number;
}

export function AgentCard({ name, role, status, message, consensusScore }: AgentCardProps) {
    const getStatusClass = (s: AgentStatus) => {
        switch (s) {
            case 'THINKING': return 'status-thinking';
            case 'VOTING': return 'status-voting';
            case 'SUCCESS': return 'status-success';
            case 'ERROR': return 'status-error';
            default: return 'status-idle';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="living-glass-panel agent-card p-6 flex flex-col gap-3 min-w-[200px]"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-white tracking-wider">{name}</h3>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">{role}</p>
                </div>
                <div className={`status-dot ${getStatusClass(status)}`} />
            </div>

            <div className="h-[1px] bg-white/10 w-full my-2"></div>

            <div className="flex-1">
                <p className="text-sm text-gray-200 italic">"{message || 'Waiting for task...'}"</p>
            </div>

            {consensusScore !== undefined && (
                <div className="mt-2 text-xs text-right text-gray-400 font-mono">
                    Trust Score: <span className="text-neon-cyan">{consensusScore}%</span>
                </div>
            )}
        </motion.div>
    );
}
