'use client';

import { useNexus } from '@/providers/NexusProvider';

export function RoutePreview() {
    const { currentRoute, loading, isInitialized } = useNexus();

    if (!isInitialized) {
        return null;
    }

    // If no route is built yet, show nothing (or placeholder if preferred, but NOT fake data)
    if (!currentRoute && !loading) {
        return (
            <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 text-center text-gray-400">
                Enter details to preview route
            </div>
        );
    }

    const displayRoute = currentRoute!;

    return (
        <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Route Preview</h2>

            {loading ? (
                <div className="flex items-center gap-2 text-gray-400">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">Calculating route...</span>
                </div>
            ) : (
                <>
                    {/* Route Steps */}
                    <div className="space-y-3 mb-6">
                        {displayRoute.steps.map((step, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">{index + 1}</span>
                                </div>
                                <div className="flex-1 p-3 bg-gray-800/50 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${step.type === 'bridge'
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {step.type.toUpperCase()}
                                        </span>
                                        <span className="text-white text-sm">
                                            {step.type === 'bridge'
                                                ? `${step.fromChain} → ${step.toChain}`
                                                : `${step.fromToken} → ${step.toToken}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Estimated Output */}
                    <div className="p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-xl border border-green-500/30">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Estimated Output</span>
                            <span className="text-2xl font-bold text-green-400">
                                {displayRoute.estimatedOutput} USDC
                            </span>
                        </div>
                    </div>

                    {/* Route Details */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-800/30 rounded-xl">
                            <p className="text-gray-400 text-xs mb-1">Est. Gas</p>
                            <p className="text-white font-medium">{displayRoute.estimatedGas}</p>
                        </div>
                        <div className="p-3 bg-gray-800/30 rounded-xl">
                            <p className="text-gray-400 text-xs mb-1">Est. Time</p>
                            <p className="text-white font-medium">{displayRoute.estimatedTime}</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
