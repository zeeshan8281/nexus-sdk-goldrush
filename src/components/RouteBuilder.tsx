'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNexus } from '@/providers/NexusProvider';
import { useStream } from '@/providers/StreamProvider';
import { SUPPORTED_CHAINS, SUPPORTED_TOKENS, RouteParams } from '@/lib/nexus';
import { PriceUpdate } from '@/lib/goldrush';

// Address map for price lookup (same as LivePricePanel for demo)
const PRICE_FEED_ADDRESSES: Record<string, string> = {
    'ETH': '0x9c087eb773291e50cf6c6a90ef0f4500e349b903', // ETH/USDC on Base (lowercase)
    // Add others if available in GoldRush streams
};

interface RouteBuilderProps {
    onRouteChange?: (params: RouteParams) => void;
}

export function RouteBuilder({ onRouteChange }: RouteBuilderProps) {
    const { handleBuildRoute, loading, isInitialized, error } = useNexus();
    const { livePrices } = useStream();

    const [fromChain, setFromChain] = useState('arbitrum');
    const [fromToken, setFromToken] = useState('ETH');
    const [amount, setAmount] = useState('0.01');
    const [toChain, setToChain] = useState('base');
    const [toToken, setToToken] = useState('USDC');
    const [action, setAction] = useState<'swap' | 'deposit'>('swap');

    // Use ref to access livePrices without triggering effect re-runs
    const livePricesRef = useRef<Map<string, PriceUpdate>>(livePrices);
    useEffect(() => {
        livePricesRef.current = livePrices;
    }, [livePrices]);

    // Build route when USER INPUTS change (debounced) - NOT on price tick
    useEffect(() => {
        if (!isInitialized) return;

        // Get live price from ref (current snapshot)
        const tokenAddr = PRICE_FEED_ADDRESSES[fromToken];
        const priceData = tokenAddr ? livePricesRef.current.get(tokenAddr.toLowerCase()) : undefined;
        const tokenPrice = priceData?.priceUsd || 0;

        const params: RouteParams = {
            fromChain,
            fromToken,
            amount,
            toChain,
            toToken,
            action,
            tokenPrice,
        };

        // Notify parent of param changes
        if (onRouteChange) {
            onRouteChange(params);
        }

        const timer = setTimeout(() => {
            if (parseFloat(amount) > 0) {
                handleBuildRoute(params);
            }
        }, 500);

        return () => clearTimeout(timer);
        // Removed livePrices from deps - we use ref to avoid infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fromChain, fromToken, amount, toChain, toToken, action, isInitialized, handleBuildRoute]);

    const swapDirections = () => {
        const tempChain = fromChain;
        const tempToken = fromToken;
        setFromChain(toChain);
        setFromToken(toToken);
        setToChain(tempChain);
        setToToken(tempToken);
    };

    return (
        <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-6">Route Builder</h2>

            {/* Action Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
                <button
                    onClick={() => setAction('swap')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${action === 'swap'
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    Swap / Bridge
                </button>
                <button
                    onClick={() => setAction('deposit')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${action === 'deposit'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    Swap & Deposit
                </button>
            </div>

            {/* FROM Section */}
            <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">From</label>
                <div className="flex gap-3">
                    <select
                        value={fromChain}
                        onChange={(e) => setFromChain(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        {SUPPORTED_CHAINS.map((chain) => (
                            <option key={chain.id} value={chain.id}>
                                {chain.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={fromToken}
                        onChange={(e) => setFromToken(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        {SUPPORTED_TOKENS.map((token) => (
                            <option key={token.symbol} value={token.symbol}>
                                {token.symbol}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Amount</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-4">
                <button
                    onClick={swapDirections}
                    className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
                >
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                </button>
            </div>

            {/* TO Section */}
            <div>
                <label className="block text-gray-400 text-sm mb-2">To</label>
                <div className="flex gap-3">
                    <select
                        value={toChain}
                        onChange={(e) => setToChain(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                        {SUPPORTED_CHAINS.map((chain) => (
                            <option key={chain.id} value={chain.id}>
                                {chain.name}
                            </option>
                        ))}
                    </select>
                    {action === 'deposit' ? (
                        <div className="flex-1 px-4 py-3 bg-blue-900/30 border border-blue-500/50 rounded-xl text-blue-300 flex items-center justify-between">
                            <span className="font-medium">Morpho Vault</span>
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Earn</span>
                        </div>
                    ) : (
                        <select
                            value={toToken}
                            onChange={(e) => setToToken(e.target.value)}
                            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                        >
                            {SUPPORTED_TOKENS.map((token) => (
                                <option key={token.symbol} value={token.symbol}>
                                    {token.symbol}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-red-200">{error}</span>
                </div>
            )}

            {loading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">Finding best route...</span>
                </div>
            )}
        </div>
    );
}
