import Link from 'next/link';
import React from 'react';

type Step = 'create' | 'submit' | 'verify' | 'complete';

interface OrganizerStepsProps {
    currentStep: Step;
}

export function OrganizerSteps({ currentStep }: OrganizerStepsProps) {
    const steps: { id: Step; label: string; href: string }[] = [
        { id: 'create', label: 'Create', href: '/create' },
        { id: 'submit', label: 'Submit', href: '/submit' },
        { id: 'verify', label: 'Verify', href: '/verify' },
        { id: 'complete', label: 'Complete', href: '/complete' },
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="flex items-center gap-4 text-sm">
            {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isPast = index < currentIndex;
                const isFuture = index > currentIndex;

                let className = "transition-all duration-300 font-medium ";
                if (isActive) {
                    className += "text-neon-cyan font-bold scale-105 drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]";
                } else if (isPast) {
                    className += "text-white hover:text-neon-cyan/80 cursor-pointer";
                } else {
                    className += "text-gray-600 cursor-not-allowed";
                }

                return (
                    <React.Fragment key={step.id}>
                        {index > 0 && (
                            <span className={`text-gray-700 ${isPast ? 'text-gray-500' : ''}`}>→</span>
                        )}

                        {isPast ? (
                            <Link href={step.href} className={className}>
                                {step.label}
                            </Link>
                        ) : (
                            <span className={className}>
                                {step.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
