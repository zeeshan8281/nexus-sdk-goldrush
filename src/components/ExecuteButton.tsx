'use client';

import { useNexus } from '@/providers/NexusProvider';
import { useState } from 'react';
import { useAccount } from 'wagmi';

export function ExecuteButton() {
    const { currentRoute, handleExecuteRoute, loading, isInitialized } = useNexus();
    const { address } = useAccount();
    const [isExecuting, setIsExecuting] = useState(false);

    const handleClick = async () => {
        if (!currentRoute || isExecuting) return;

        setIsExecuting(true);
        try {
            await handleExecuteRoute(address);
        } finally {
            setIsExecuting(false);
        }
    };

    const isDisabled = !isInitialized || !currentRoute || loading || isExecuting;

    return (
        <button
            onClick={handleClick}
            disabled={isDisabled}
            className={`
        w-full py-4 rounded-xl font-semibold text-lg transition-all
        ${isDisabled
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-[1.02]'
                }
      `}
        >
            {isExecuting ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Executing...
                </span>
            ) : !isInitialized ? (
                'Connect Wallet First'
            ) : !currentRoute ? (
                'Build Route First'
            ) : (
                'Execute Route'
            )}
        </button>
    );
}
