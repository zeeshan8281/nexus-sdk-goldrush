import { NexusSDK } from '@avail-project/nexus-core';
import { encodeFunctionData, parseAbi } from 'viem';

// Singleton instance of the Nexus SDK
export const sdk = new NexusSDK({ network: 'mainnet' });

// Check if SDK is initialized
export function isInitialized(): boolean {
    return sdk.isInitialized();
}

// Initialize SDK with wallet provider
export async function initializeWithProvider(provider: any): Promise<void> {
    if (!provider) throw new Error('No EIP-1193 provider found');
    if (sdk.isInitialized()) return;
    await sdk.initialize(provider);
}

// Deinitialize SDK
export async function deinit(): Promise<void> {
    if (!sdk.isInitialized()) return;
    await sdk.deinit();
}

// Get unified balances across all chains
export async function getUnifiedBalances() {
    if (!sdk.isInitialized()) throw new Error('SDK not initialized');
    return await sdk.getUnifiedBalances(true);
}

// Supported chains for the UI dropdowns
export const SUPPORTED_CHAINS = [
    { id: 'arbitrum', name: 'Arbitrum', chainId: 42161 },
    { id: 'base', name: 'Base', chainId: 8453 },
    { id: 'polygon', name: 'Polygon', chainId: 137 },
    { id: 'optimism', name: 'Optimism', chainId: 10 },
    { id: 'ethereum', name: 'Ethereum', chainId: 1 },
];

// Common tokens
export const SUPPORTED_TOKENS = [
    { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
    { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    { symbol: 'USDT', name: 'Tether', decimals: 6 },
    { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
];

// Target Address for Morpho Vault (Seamless USDC Vault on Base)
// Source: 0x616a4E1db48e22028f6bbf20444Cd3b8e3273738
const MORPHO_VAULT_ADDRESS = '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738';

// Route parameters interface
export interface RouteParams {
    fromChain: string;
    fromToken: string;
    amount: string;
    toChain: string;
    toToken: string;
    action?: 'swap' | 'deposit';
    tokenPrice?: number; // New: Live price for gas calc
}

// Route step interface
export interface RouteStep {
    type: 'bridge' | 'swap' | 'deposit';
    fromChain: string;
    toChain: string;
    fromToken: string;
    toToken: string;
    estimatedAmount?: string;
}

// Route result interface
export interface RouteResult {
    steps: RouteStep[];
    estimatedOutput: string;
    estimatedGas: string;
    estimatedTime: string;
}

// Build a cross-chain route (Real Calculation)
export async function buildRoute(params: RouteParams): Promise<RouteResult | null> {
    if (!sdk.isInitialized()) throw new Error('SDK not initialized');

    try {
        const fromChainObj = SUPPORTED_CHAINS.find(c => c.id === params.fromChain);
        const toChainObj = SUPPORTED_CHAINS.find(c => c.id === params.toChain);

        if (!fromChainObj || !toChainObj) throw new Error('Invalid chain selected');

        const amountBigInt = (sdk as any).convertTokenReadableAmountToBigInt(
            params.amount,
            params.fromToken,
            fromChainObj.chainId
        );

        const isDeposit = params.action === 'deposit';
        const isSameChain = fromChainObj.chainId === toChainObj.chainId;
        let estimatedGas = '$0.00';
        let estimatedTime = '2 mins';
        let steps: RouteStep[] = [];

        // --- SAME CHAIN = SWAP, not bridge ---
        if (isSameChain && !isDeposit) {
            // For same-chain swaps, we'd use sdk.simulateSwap (if available) or estimate locally
            // For now, return a simple swap preview without heavy simulation
            return {
                steps: [
                    {
                        type: 'swap',
                        fromChain: params.fromChain,
                        toChain: params.toChain,
                        fromToken: params.fromToken,
                        toToken: params.toToken,
                        estimatedAmount: params.amount
                    }
                ],
                estimatedOutput: params.amount, // Would need DEX quote for real output
                estimatedGas: '~$0.50', // Swap gas is typically low
                estimatedTime: '< 1 min'
            };
        }

        // --- CROSS-CHAIN = Bridge required ---
        const simulation = await sdk.simulateBridge({
            token: params.fromToken,
            amount: amountBigInt,
            toChainId: toChainObj.chainId,
            sourceChains: [fromChainObj.chainId]
        });

        // Calculate Real Gas in USD
        if (simulation && simulation.intent && simulation.intent.fees) {
            const feeTotal = parseFloat(simulation.intent.fees.total || '0');
            if (params.tokenPrice && feeTotal > 0) {
                const usdCost = feeTotal * params.tokenPrice;
                estimatedGas = `$${usdCost.toFixed(2)}`;
            } else {
                estimatedGas = `${feeTotal.toFixed(6)} ETH`;
            }
        }

        if (isDeposit) {
            // For deposit, we append the deposit step visually
            // In a full implementation, we'd use simulateBridgeAndExecute results if they provided specific execute-step fees
            steps = [
                {
                    type: 'bridge',
                    fromChain: params.fromChain,
                    toChain: params.toChain,
                    fromToken: params.fromToken,
                    toToken: params.fromToken,
                    estimatedAmount: params.amount
                },
                {
                    type: 'deposit',
                    fromChain: params.toChain,
                    toChain: params.toChain,
                    fromToken: params.fromToken,
                    toToken: 'Morpho Vault',
                    estimatedAmount: params.amount
                }
            ];
            estimatedTime = '3 mins (Bridge + Deposit)';
        } else {
            // Standard execution
            steps = [
                {
                    type: 'bridge',
                    fromChain: params.fromChain,
                    toChain: params.toChain,
                    fromToken: params.fromToken,
                    toToken: params.fromToken,
                    estimatedAmount: params.amount
                }
            ];
        }

        return {
            steps,
            estimatedOutput: params.amount, // In a swap this would differ, for bridge it's 1:1 usually minus fees (subtracted from input vs paid on top depends on token)
            estimatedGas,
            estimatedTime
        };

    } catch (error: any) {
        console.error('Error building route:', error);

        // Handle specific SDK errors for better UX
        const errorMessage = error?.message || '';
        if (errorMessage.includes('Insufficient balance')) {
            throw new Error('Insufficient balance for simulation. Lower the amount or fund your wallet.');
        }

        throw error; // Re-throw generic errors
    }
}

// Execute a route with step callbacks
export async function executeRoute(
    route: RouteResult,
    onStep: (step: { status: string; message: string }) => void,
    userAddress?: string // New: needed for 'onBehalfOf' in Morpho
): Promise<boolean> {
    if (!sdk.isInitialized()) throw new Error('SDK not initialized');

    try {
        const step = route.steps[0];
        const fromChainObj = SUPPORTED_CHAINS.find(c => c.id === step.fromChain);
        const toChainObj = SUPPORTED_CHAINS.find(c => c.id === step.toChain);

        if (!fromChainObj || !toChainObj) throw new Error('Invalid chain in route');

        const amountBigInt = (sdk as any).convertTokenReadableAmountToBigInt(
            step.estimatedAmount || '0',
            step.fromToken,
            fromChainObj.chainId
        );

        const isDeposit = route.steps.some(s => s.type === 'deposit');

        if (isDeposit) {
            if (!userAddress) throw new Error('User address required for deposit');

            onStep({ status: 'pending', message: 'Initiating Bridge & Deposit...' });

            // 1. Encode Morpho 'supply' function
            // supply(address asset, uint256 amount, address onBehalfOf)
            // Note: In a real app we'd get the underlying asset address dynamically. 
            // For this MVP demo with USDC (Base), we assume the token IS the asset or we hardcode USDC Base.
            // USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
            const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

            const data = encodeFunctionData({
                abi: parseAbi(['function supply(address asset, uint256 amount, address onBehalfOf)']),
                functionName: 'supply',
                args: [USDC_BASE, amountBigInt, userAddress as `0x${string}`]
            });

            // 2. Call SDK bridgeAndExecute
            await (sdk as any).bridgeAndExecute({
                token: step.fromToken,
                amount: amountBigInt,
                toChainId: toChainObj.chainId,
                sourceChains: [fromChainObj.chainId],
                execute: {
                    to: MORPHO_VAULT_ADDRESS,
                    value: 0n,
                    data: data,
                    gas: 600000n // Estimate
                }
            }, {
                onEvent: (eventRaw: any) => {
                    console.log('Nexus Event:', eventRaw);
                    // Handle single argument event (EventUnion)
                    // It might be a string or an object with type/event property
                    const eventName = typeof eventRaw === 'string' ? eventRaw : (eventRaw?.event || eventRaw?.type || 'UNKNOWN_EVENT');

                    if (eventName === 'EXECUTE_COMPLETED') {
                        onStep({ status: 'pending', message: 'Deposit Complete!' });
                    } else {
                        onStep({ status: 'pending', message: `Status: ${eventName}` });
                    }
                }
            });

            onStep({ status: 'completed', message: 'Bridge & Deposit Success!' });


        } else {
            // Standard Bridge
            onStep({ status: 'pending', message: 'Initiating Bridge...' });

            await sdk.bridge(
                {
                    token: step.fromToken,
                    amount: amountBigInt,
                    toChainId: toChainObj.chainId,
                    sourceChains: [fromChainObj.chainId]
                },
                {
                    onEvent: (eventRaw: any) => {
                        console.log('Nexus Event:', eventRaw);
                        const eventName = typeof eventRaw === 'string' ? eventRaw : (eventRaw?.event || eventRaw?.type || 'UNKNOWN_EVENT');
                        onStep({ status: 'pending', message: `Status: ${eventName}` });
                    }
                }
            );
            onStep({ status: 'completed', message: 'Bridge Complete!' });
        }

        return true;
    } catch (error) {
        console.error('Error executing route:', error);
        onStep({ status: 'error', message: 'Failed to execute' });
        return false;
    }
}
