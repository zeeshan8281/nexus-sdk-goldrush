'use client';

import { useNexus } from '@/providers/NexusProvider';

export function ExecutionTimeline() {
    const { executionSteps, loading, currentRoute } = useNexus();

    if (executionSteps.length === 0 && !loading) {
        return null;
    }

    // Demo steps for showing the UI when not executing
    const displaySteps = executionSteps.length > 0 ? executionSteps : [];

    const getStepIcon = (status: string) => {
        switch (status) {
            case 'completed':
            case 'success':
                return (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'pending':
            case 'in_progress':
                return (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                );
            case 'failed':
            case 'error':
                return (
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    </div>
                );
        }
    };

    const getStepColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'success':
                return 'text-green-400';
            case 'pending':
            case 'in_progress':
                return 'text-blue-400';
            case 'failed':
            case 'error':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Execution Progress</h2>

            <div className="space-y-4">
                {displaySteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                        {/* Icon */}
                        {getStepIcon(step.status)}

                        {/* Content */}
                        <div className="flex-1">
                            <p className={`font-medium ${getStepColor(step.status)}`}>
                                {step.message}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                                Step {index + 1}
                            </p>
                        </div>
                    </div>
                ))}

                {loading && displaySteps.length === 0 && (
                    <div className="flex items-center gap-3 text-gray-400">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Preparing execution...</span>
                    </div>
                )}
            </div>

            {/* Success State */}
            {displaySteps.length > 0 && displaySteps.every(s => s.status === 'completed' || s.status === 'success') && (
                <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                    <p className="text-green-400 font-medium text-center">
                        🎉 Route executed successfully!
                    </p>
                </div>
            )}
        </div>
    );
}
