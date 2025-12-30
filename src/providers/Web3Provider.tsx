'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, arbitrum, polygon, optimism, base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import NexusProvider from '@/components/nexus/NexusProvider';
import { StreamProvider } from './StreamProvider';
import { ReactNode } from 'react';

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

const config = getDefaultConfig({
    appName: 'Cross-Chain Router Dashboard',
    projectId: walletConnectProjectId,
    chains: [mainnet, arbitrum, polygon, optimism, base],
    ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider modalSize="compact">
                    <NexusProvider
                        config={{
                            network: 'mainnet',
                            debug: true,
                        }}
                    >
                        <StreamProvider>
                            {children}
                        </StreamProvider>
                    </NexusProvider>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
