'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import {
    subscribeToUpdatePairs,
    subscribeToOHLCVTokens,
    subscribeToTokenPrices,
    disconnectStreaming,
    PriceUpdate,
    OHLCVCandle,
} from '@/lib/goldrush';

// Stream context interface
interface StreamContextType {
    isConnected: boolean;
    livePrices: Map<string, PriceUpdate>;
    ohlcvData: OHLCVCandle[];
    lastUpdate: Date | null;
    error: string | null;
    // Actions
    subscribeToPairs: (chainName: string, pairAddresses: string[]) => void;
    subscribeToTokens: (chainName: string, tokenAddresses: string[]) => void;
    unsubscribeAll: () => void;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

export function StreamProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [livePrices, setLivePrices] = useState<Map<string, PriceUpdate>>(new Map());
    const [ohlcvData, setOhlcvData] = useState<OHLCVCandle[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const unsubscribeFns = useRef<(() => void)[]>([]);

    // Subscribe to pair updates
    const subscribeToPairs = useCallback((chainName: string, pairAddresses: string[]) => {
        if (pairAddresses.length === 0) return;

        setError(null);
        try {
            const unsubscribe = subscribeToUpdatePairs(
                chainName,
                pairAddresses,
                (updates) => {
                    console.log('GoldRush Price Updates:', updates);
                    setIsConnected(true);
                    setLastUpdate(new Date());
                    setLivePrices(prev => {
                        const newMap = new Map(prev);
                        updates.forEach(update => {
                            newMap.set(update.pairAddress, update);
                        });
                        return newMap;
                    });
                },
                (err) => {
                    setError(err.message || 'Streaming error');
                    setIsConnected(false);
                }
            );

            unsubscribeFns.current.push(unsubscribe);
        } catch (err: any) {
            setError(err.message || 'Failed to subscribe');
        }
    }, []);

    // Subscribe to token OHLCV
    const subscribeToTokens = useCallback((chainName: string, tokenAddresses: string[]) => {
        if (tokenAddresses.length === 0) return;

        setError(null);
        try {
            const unsubscribe = subscribeToOHLCVTokens(
                chainName,
                tokenAddresses,
                'ONE_MINUTE',
                'ONE_HOUR',
                (candles) => {
                    setIsConnected(true);
                    setLastUpdate(new Date());
                    setOhlcvData(candles);
                },
                (err) => {
                    setError(err.message || 'OHLCV streaming error');
                }
            );

            unsubscribeFns.current.push(unsubscribe);
        } catch (err: any) {
            setError(err.message || 'Failed to subscribe to OHLCV');
        }
    }, []);

    // Unsubscribe from all streams
    const unsubscribeAll = useCallback(() => {
        unsubscribeFns.current.forEach(unsub => {
            try {
                unsub();
            } catch (e) {
                console.error('Error unsubscribing:', e);
            }
        });
        unsubscribeFns.current = [];
        setIsConnected(false);
        setLivePrices(new Map());
        setOhlcvData([]);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            unsubscribeAll();
            disconnectStreaming();
        };
    }, [unsubscribeAll]);

    const value: StreamContextType = {
        isConnected,
        livePrices,
        ohlcvData,
        lastUpdate,
        error,
        subscribeToPairs,
        subscribeToTokens,
        unsubscribeAll,
    };

    return (
        <StreamContext.Provider value={value}>
            {children}
        </StreamContext.Provider>
    );
}

export function useStream() {
    const context = useContext(StreamContext);
    if (context === undefined) {
        throw new Error('useStream must be used within a StreamProvider');
    }
    return context;
}
