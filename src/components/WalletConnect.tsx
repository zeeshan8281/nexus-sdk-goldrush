'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useNexus } from '@/providers/NexusProvider';
import { useEffect } from 'react';

export function WalletConnect() {
    const { connector, isConnected } = useAccount();
    const { handleInit, isInitialized, loading } = useNexus();

    // Auto-initialize Nexus when wallet connects
    useEffect(() => {
        const initNexus = async () => {
            if (isConnected && connector && !isInitialized && !loading) {
                try {
                    const provider = await connector.getProvider();
                    await handleInit(provider);
                } catch (error) {
                    console.error('Failed to initialize Nexus:', error);
                }
            }
        };

        initNexus();
    }, [isConnected, connector, isInitialized, loading, handleInit]);

    return (
        <div className="flex items-center gap-4">
            <ConnectButton.Custom>
                {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                        <div
                            {...(!ready && {
                                'aria-hidden': true,
                                style: {
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                },
                            })}
                        >
                            {(() => {
                                if (!connected) {
                                    return (
                                        <button
                                            onClick={openConnectModal}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                                        >
                                            Connect Wallet
                                        </button>
                                    );
                                }

                                if (chain.unsupported) {
                                    return (
                                        <button
                                            onClick={openChainModal}
                                            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all"
                                        >
                                            Wrong Network
                                        </button>
                                    );
                                }

                                return (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={openChainModal}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all"
                                        >
                                            {chain.hasIcon && chain.iconUrl && (
                                                <img
                                                    alt={chain.name ?? 'Chain icon'}
                                                    src={chain.iconUrl}
                                                    className="w-5 h-5 rounded-full"
                                                />
                                            )}
                                            <span className="text-white text-sm font-medium">{chain.name}</span>
                                        </button>

                                        <button
                                            onClick={openAccountModal}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                                        >
                                            {account.displayName}
                                        </button>

                                        {isInitialized && (
                                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                                                Nexus Ready
                                            </span>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    );
                }}
            </ConnectButton.Custom>
        </div>
    );
}
