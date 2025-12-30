'use client';

import { useEffect, useRef, useState } from 'react';
import { subscribeToUpdatePairs, PriceUpdate } from '@/lib/goldrush';

// Use a known active pair on Base - VIRTUAL/WETH (from GoldRush docs example)
const VIRTUAL_PAIR = '0x1185cb5122edad199bdbc0cbd7a0457e448f23c7';
// ETH/USDC pair on Base
const ETH_USDC_PAIR = '0x88a43bbdf9d098eec7bceda4e2494615dfd9bb9c';

interface LivePricePanelProps {
    pairAddress?: string;
    chainName?: string;
}

export function LivePricePanel({
    pairAddress = ETH_USDC_PAIR,
    chainName = 'BASE_MAINNET'
}: LivePricePanelProps) {
    const hasSubscribed = useRef(false);
    const [priceData, setPriceData] = useState<PriceUpdate | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rawData, setRawData] = useState<any>(null);

    // Subscribe to GoldRush updatePairs stream
    useEffect(() => {
        if (hasSubscribed.current) return;
        hasSubscribed.current = true;

        console.log('🔗 Subscribing to GoldRush updatePairs:', chainName, pairAddress);

        const unsubscribe = subscribeToUpdatePairs(
            chainName,
            [pairAddress],
            (updates) => {
                console.log('📊 GoldRush Update:', updates);
                setIsConnected(true);
                setError(null);
                if (updates.length > 0) {
                    setPriceData(updates[0]);
                    setRawData(updates[0]);
                    setLastUpdate(new Date());
                }
            },
            (err) => {
                console.error('❌ GoldRush Error:', err);
                setError(err?.message || 'Stream error');
                setIsConnected(false);
            }
        );

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [chainName, pairAddress]);

    // Display price - try quote_rate first (should be the exchange rate for pairs)
    const displayPrice = priceData?.price || priceData?.priceUsd || 0;
    const displayChange = priceData?.priceDeltas?.last1hr || 0;
    const direction = displayChange >= 0 ? 'up' : 'down';

    const formatTime = (date: Date | null) => {
        if (!date) return 'waiting...';
        return date.toLocaleTimeString();
    };

    // Loading state
    if (!isConnected && !error) {
        return (
            <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 flex items-center justify-center min-h-[200px]">
                <div className="flex flex-col items-center gap-3 text-blue-400">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">Connecting to GoldRush Stream...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-red-800/50">
                <h2 className="text-lg font-semibold text-white mb-2">Live Market</h2>
                <div className="p-4 bg-red-900/20 rounded-xl text-red-400 text-sm">
                    <p className="font-medium">GoldRush Error:</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Live Market</h2>
                <div className="flex items-center gap-2">
                    <span className={isConnected ? 'text-green-400' : 'text-yellow-400'}>●</span>
                    <span className="text-gray-400 text-xs">{isConnected ? 'Live' : 'Connecting'}</span>
                </div>
            </div>

            {/* Main Price Display */}
            <div className="p-4 bg-gray-800/50 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">ETH/USDC</span>
                    <span className="text-xs text-gray-500">Base</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-white">
                        ${displayPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-sm font-medium ${direction === 'up'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                        {direction === 'up' ? '↑' : '↓'} {Math.abs(displayChange).toFixed(2)}%
                    </span>
                </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-gray-800/30 rounded-xl">
                    <p className="text-gray-400 text-xs mb-1">Liquidity</p>
                    <p className="text-white font-medium flex items-center gap-1">
                        {priceData?.liquidity ? (
                            <>${(priceData.liquidity / 1000000).toFixed(2)}M</>
                        ) : (
                            <><span className="text-green-400">●</span> Healthy</>
                        )}
                    </p>
                </div>
                <div className="p-3 bg-gray-800/30 rounded-xl">
                    <p className="text-gray-400 text-xs mb-1">24h Volume</p>
                    <p className="text-white font-medium">
                        {priceData?.volumeUsd ? `$${priceData.volumeUsd.toLocaleString('en-US')}` : '$0'}
                    </p>
                </div>
            </div>

            {/* Debug: Raw Data Preview */}
            {rawData && (
                <details className="mb-4">
                    <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-400">
                        Debug: Raw GoldRush Data
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-400 overflow-auto max-h-32">
                        {JSON.stringify(rawData, null, 2)}
                    </pre>
                </details>
            )}

            {/* Last Update */}
            <div className="flex items-center justify-between text-gray-400 text-xs">
                <span>Last updated</span>
                <span className="font-mono">{formatTime(lastUpdate)}</span>
            </div>
        </div>
    );
}
