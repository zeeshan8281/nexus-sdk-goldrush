'use client';

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import {
    sdk,
    initializeWithProvider,
    deinit,
    getUnifiedBalances,
    buildRoute,
    executeRoute,
    RouteParams,
    RouteResult,
    isInitialized
} from '@/lib/nexus';

// Balance item interface
interface BalanceItem {
    token: string;
    chain: string;
    balance: string;
    balanceUsd?: number;
}

// Nexus context interface
interface NexusContextType {
    isInitialized: boolean;
    loading: boolean;
    error: string | null;
    balances: BalanceItem[];
    currentRoute: RouteResult | null;
    executionSteps: { status: string; message: string }[];
    // Actions
    handleInit: (provider: any) => Promise<void>;
    handleDeinit: () => Promise<void>;
    fetchBalances: () => Promise<void>;
    handleBuildRoute: (params: RouteParams) => Promise<RouteResult | null>;
    handleExecuteRoute: (userAddress?: string) => Promise<boolean>;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

export function NexusProvider({ children }: { children: ReactNode }) {
    const [initialized, setInitialized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [balances, setBalances] = useState<BalanceItem[]>([]);
    const [currentRoute, setCurrentRoute] = useState<RouteResult | null>(null);
    const [executionSteps, setExecutionSteps] = useState<{ status: string; message: string }[]>([]);

    // Initialize Nexus SDK
    const handleInit = useCallback(async (provider: any) => {
        setLoading(true);
        setError(null);
        try {
            await initializeWithProvider(provider);
            setInitialized(true);

            // Fetch initial balances
            const balanceData = await getUnifiedBalances();
            console.log('Nexus Balance Data:', balanceData);
            if (balanceData) {
                // Transform balance data to our format
                const formattedBalances: BalanceItem[] = [];
                if (Array.isArray(balanceData)) {
                    balanceData.forEach((item: any) => {
                        // Map chainId to chain name
                        let chainName = 'Unknown';
                        if (item.chainID || item.chainId) {
                            const chainId = item.chainID || item.chainId;
                            const chainMap: Record<number, string> = {
                                1: 'Ethereum',
                                10: 'Optimism',
                                137: 'Polygon',
                                8453: 'Base',
                                42161: 'Arbitrum',
                            };
                            chainName = chainMap[chainId] || `Chain ${chainId}`;
                        }
                        formattedBalances.push({
                            token: item.symbol || item.token || 'Unknown',
                            chain: chainName,
                            balance: item.amount || item.balance || '0',
                            balanceUsd: item.value || item.balanceUsd || item.valueUsd || 0,
                        });
                    });
                }
                setBalances(formattedBalances);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to initialize Nexus');
            console.error('Nexus init error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Deinitialize
    const handleDeinit = useCallback(async () => {
        setLoading(true);
        try {
            await deinit();
            setInitialized(false);
            setBalances([]);
            setCurrentRoute(null);
            setExecutionSteps([]);
        } catch (err: any) {
            setError(err.message || 'Failed to deinitialize');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch balances
    const fetchBalances = useCallback(async () => {
        if (!isInitialized()) return;

        setLoading(true);
        try {
            const balanceData = await getUnifiedBalances();
            if (balanceData) {
                const formattedBalances: BalanceItem[] = [];
                if (Array.isArray(balanceData)) {
                    balanceData.forEach((item: any) => {
                        formattedBalances.push({
                            token: item.token || item.symbol || 'Unknown',
                            chain: item.chain || item.network || 'Unknown',
                            balance: item.balance || item.amount || '0',
                            balanceUsd: item.balanceUsd || item.valueUsd || 0,
                        });
                    });
                }
                setBalances(formattedBalances);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch balances');
        } finally {
            setLoading(false);
        }
    }, []);

    // Build route
    const handleBuildRoute = useCallback(async (params: RouteParams): Promise<RouteResult | null> => {
        if (!isInitialized()) {
            setError('SDK not initialized');
            return null;
        }

        setLoading(true);
        setError(null);
        try {
            const route = await buildRoute(params);
            setCurrentRoute(route);
            return route;
        } catch (err: any) {
            setError(err.message || 'Failed to build route');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Execute route
    const handleExecuteRoute = useCallback(async (userAddress?: string): Promise<boolean> => {
        if (!currentRoute) {
            setError('No route to execute');
            return false;
        }

        setLoading(true);
        setError(null);
        setExecutionSteps([]);

        try {
            const success = await executeRoute(currentRoute, (step) => {
                setExecutionSteps(prev => [...prev, step]);
            }, userAddress);
            return success;
        } catch (err: any) {
            setError(err.message || 'Failed to execute route');
            return false;
        } finally {
            setLoading(false);
        }
    }, [currentRoute]);

    const value: NexusContextType = {
        isInitialized: initialized,
        loading,
        error,
        balances,
        currentRoute,
        executionSteps,
        handleInit,
        handleDeinit,
        fetchBalances,
        handleBuildRoute,
        handleExecuteRoute,
    };

    return (
        <NexusContext.Provider value={value}>
            {children}
        </NexusContext.Provider>
    );
}

export function useNexus() {
    const context = useContext(NexusContext);
    if (context === undefined) {
        throw new Error('useNexus must be used within a NexusProvider');
    }
    return context;
}
