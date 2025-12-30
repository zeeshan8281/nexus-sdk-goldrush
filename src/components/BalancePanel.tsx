'use client';

import { useNexus } from '@/providers/NexusProvider';

export function BalancePanel() {
    const { balances, loading, isInitialized, fetchBalances } = useNexus();

    if (!isInitialized) {
        return (
            <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-4">Unified Balances</h2>
                <p className="text-gray-400 text-sm">Connect your wallet to view balances</p>
            </div>
        );
    }

    // Use real balances only - no mocks
    const displayBalances = balances;

    if (displayBalances.length === 0 && !loading) {
        return (
            <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-4">Unified Balances</h2>
                <p className="text-gray-400 text-sm text-center py-4">No balances found</p>
            </div>
        );
    }

    const totalUsd = displayBalances.reduce((sum, b) => sum + (b.balanceUsd || 0), 0);

    return (
        <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Unified Balances</h2>
                <button
                    onClick={fetchBalances}
                    disabled={loading}
                    className="text-blue-400 text-sm hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            <div className="mb-4 p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30">
                <p className="text-gray-400 text-xs mb-1">Total Value</p>
                <p className="text-2xl font-bold text-white">${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="space-y-2">
                {displayBalances.map((balance, index) => (
                    <div
                        key={`${balance.token}-${balance.chain}-${index}`}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800/70 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{balance.token.slice(0, 2)}</span>
                            </div>
                            <div>
                                <p className="text-white font-medium">{balance.token}</p>
                                <p className="text-gray-400 text-xs">{balance.chain}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-medium">{balance.balance}</p>
                            {balance.balanceUsd !== undefined && (
                                <p className="text-gray-400 text-xs">${balance.balanceUsd.toFixed(2)}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
