'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AgentStatus = 'IDLE' | 'THINKING' | 'VOTING' | 'SUCCESS' | 'ERROR';

interface AgentState {
    id: string;
    name: string;
    role: string;
    status: AgentStatus;
    message: string;
    consensusScore: number;
}

interface OrganizerContextType {
    bounty: {
        name: string;
        amount: number;
        currency: string;
        formattedAmount: string; // "12,500.00 MNEE"
    };
    winner: {
        address: string;
        projectName: string;
        projectUrl: string;
        category: string;
        verificationCriteria: string; // [NEW] Added per user request
    };
    verification: {
        status: 'idle' | 'in-progress' | 'complete';
        agents: AgentState[];
        txHash?: string;
    };
    setBounty: (data: Partial<OrganizerContextType['bounty']>) => void;
    setWinner: (data: Partial<OrganizerContextType['winner']>) => void;
    setVerificationStatus: (status: 'idle' | 'in-progress' | 'complete') => void;
    updateAgents: (agents: AgentState[]) => void;
    setTxHash: (hash: string) => void;
}

const formatCurrency = (amount: number, currency: string) => {
    // Ensure 2 decimal places always, even for round numbers
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
};

const INITIAL_AGENTS: AgentState[] = [
    { id: '1', name: 'Scout', role: 'Discovery', status: 'IDLE', message: 'Waiting for trigger...', consensusScore: 100 },
    { id: '2', name: 'Analyst', role: 'Evaluation', status: 'IDLE', message: 'Waiting for data...', consensusScore: 100 },
    { id: '3', name: 'Auditor', role: 'Security', status: 'IDLE', message: 'Vault secure.', consensusScore: 100 },
    { id: '4', name: 'Compliance', role: 'Legal', status: 'IDLE', message: 'Policy engine loaded.', consensusScore: 100 },
    { id: '5', name: 'Executor', role: 'Payout', status: 'IDLE', message: 'Wallet ready.', consensusScore: 100 },
];

const OrganizerContext = createContext<OrganizerContextType | undefined>(undefined);

export function OrganizerProvider({ children }: { children: ReactNode }) {
    const [bounty, setBountyState] = useState({
        name: 'MNEE Hackathon 2026',
        amount: 12500,
        currency: 'MNEE',
        formattedAmount: '12,500.00 MNEE'
    });

    const [winner, setWinnerState] = useState({
        address: '',
        projectName: 'BountySwarm',
        projectUrl: 'https://github.com/hello-caleb/bountyswarm',
        category: 'AI_AGENT_PAYMENTS',
        verificationCriteria: '1. Code must compile.\n2. Must use MNEE token.\n3. Must include unit tests.'
    });

    // Hydrate from Storage on Mount
    React.useEffect(() => {
        const storedBounty = sessionStorage.getItem('bs_bounty');
        const storedWinner = sessionStorage.getItem('bs_winner');
        if (storedBounty) setBountyState(JSON.parse(storedBounty));
        if (storedWinner) setWinnerState(JSON.parse(storedWinner));
    }, []);

    // Persist to Storage
    React.useEffect(() => {
        sessionStorage.setItem('bs_bounty', JSON.stringify(bounty));
    }, [bounty]);

    React.useEffect(() => {
        sessionStorage.setItem('bs_winner', JSON.stringify(winner));
    }, [winner]);



    const [verification, setVerification] = useState<{
        status: 'idle' | 'in-progress' | 'complete';
        agents: AgentState[];
        txHash?: string;
    }>({
        status: 'idle',
        agents: INITIAL_AGENTS
    });

    const setBounty = (data: Partial<typeof bounty>) => {
        setBountyState(prev => {
            const next = { ...prev, ...data };
            // Auto-update formatted amount if amount changes
            if (data.amount || data.currency) {
                next.formattedAmount = formatCurrency(next.amount, next.currency);
            }
            return next;
        });
    };

    const setWinner = (data: Partial<typeof winner>) => {
        setWinnerState(prev => ({ ...prev, ...data }));
    };

    const setVerificationStatus = (status: 'idle' | 'in-progress' | 'complete') => {
        setVerification(prev => ({ ...prev, status }));
    };

    const updateAgents = (newAgents: AgentState[]) => {
        setVerification(prev => ({ ...prev, agents: newAgents }));
    };

    const setTxHash = (txHash: string) => {
        setVerification(prev => ({ ...prev, txHash }));
    };

    return (
        <OrganizerContext.Provider value={{
            bounty,
            winner,
            verification,
            setBounty,
            setWinner,
            setVerificationStatus,
            updateAgents,
            setTxHash
        }}>
            {children}
        </OrganizerContext.Provider>
    );
}

export const useOrganizer = () => {
    const context = useContext(OrganizerContext);
    if (!context) throw new Error('useOrganizer must be used within OrganizerProvider');
    return context;
};
