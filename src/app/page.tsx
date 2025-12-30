'use client';

import { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useNexus } from '@/components/nexus/NexusProvider';
import UnifiedBalance from '@/components/unified-balance/unified-balance';
import FastBridge from '@/components/fast-bridge/fast-bridge';
import { LivePricePanel } from '@/components/LivePricePanel';
import { type EthereumProvider } from '@avail-project/nexus-core';

export default function Home() {
  const { connector, isConnected, address } = useAccount();
  const { handleInit, nexusSDK, loading } = useNexus();

  // Auto-initialize Nexus when wallet connects
  useEffect(() => {
    const initNexus = async () => {
      if (isConnected && connector && !nexusSDK && !loading) {
        try {
          const provider = await connector.getProvider() as EthereumProvider;
          await handleInit(provider);
        } catch (error) {
          console.error('Failed to initialize Nexus:', error);
        }
      }
    };

    initNexus();
  }, [isConnected, connector, nexusSDK, loading, handleInit]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Cross-Chain Router</h1>
              <p className="text-gray-400 text-xs">Powered by Nexus Elements + GoldRush</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {nexusSDK && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                Nexus Ready
              </span>
            )}
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {!isConnected && (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to access unified balances and cross-chain bridging</p>
            <ConnectButton />
          </div>
        )}

        {isConnected && !nexusSDK && (
          <div className="text-center py-20">
            <div className="flex items-center justify-center gap-3 text-blue-400">
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xl">Initializing Nexus SDK...</span>
            </div>
          </div>
        )}

        {nexusSDK && address && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column - Unified Balance */}
            <div className="space-y-6">
              <div className="p-2 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
                <h2 className="text-lg font-semibold text-white p-4 pb-2">Unified Balances</h2>
                <UnifiedBalance />
              </div>
            </div>

            {/* Center Column - Fast Bridge */}
            <div className="space-y-6">
              <div className="p-2 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
                <h2 className="text-lg font-semibold text-white p-4 pb-2">Fast Bridge</h2>
                <FastBridge connectedAddress={address} />
              </div>
            </div>

            {/* Right Column - Live Market */}
            <div className="space-y-6">
              <LivePricePanel />

              {/* Info Panel */}
              <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Nexus Elements</p>
                      <p className="text-gray-400 text-xs">Pre-built components for cross-chain bridging</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-purple-400 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">GoldRush Streaming</p>
                      <p className="text-gray-400 text-xs">Real-time market data from DEX pairs</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-400 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Real Execution</p>
                      <p className="text-gray-400 text-xs">No mocks - actual blockchain transactions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            Live Cross-Chain Router Dashboard MVP
          </p>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm">Built with</span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">Nexus Elements</span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">GoldRush Streaming</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
