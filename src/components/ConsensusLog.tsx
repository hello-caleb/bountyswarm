import React from 'react';

interface ConsensusLogProps {
    logs: string[];
}

export function ConsensusLog({ logs }: ConsensusLogProps) {
    return (
        <div className="living-glass-panel p-6 min-h-[400px] flex flex-col">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></span>
                Consensus Audit Trail
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-sm text-gray-300 pr-2 custom-scrollbar">
                {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                        <div className="w-8 h-8 rounded-full border-2 border-gray-700 border-t-neon-cyan animate-spin"></div>
                        <span>Waiting for swarm activation...</span>
                    </div>
                )}

                {logs.map((log, i) => (
                    <div key={i} className="flex gap-4 border-b border-white/5 pb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Simple parsing for color coding names */}
                        <span className="break-words" dangerouslySetInnerHTML={{
                            __html: log.replace(
                                /(Scout|Analyst|Auditor|Compliance|Executor)/,
                                '<span class="text-neon-cyan font-bold">$1</span>'
                            ).replace(
                                /(SUCCESS|APPROVED)/,
                                '<span class="text-neon-green">$1</span>'
                            ).replace(
                                /(THINKING)/,
                                '<span class="text-neon-purple">$1</span>'
                            ).replace(
                                /(FAILED|ERROR|REJECTED)/,
                                '<span class="text-neon-error">$1</span>'
                            )
                        }} />
                    </div>
                ))}
            </div>
        </div>
    );
}
