import { GoldRushClient } from '@covalenthq/client-sdk';

// GoldRush streaming client (will be initialized lazily)
let goldRushClient: GoldRushClient | null = null;

// Initialize GoldRush client
export function getGoldRushClient(): GoldRushClient {
    if (!goldRushClient) {
        const apiKey = process.env.NEXT_PUBLIC_GOLDRUSH_API_KEY;
        if (!apiKey || apiKey === 'your_goldrush_api_key') {
            throw new Error('GoldRush API key not configured');
        }
        goldRushClient = new GoldRushClient(
            apiKey,
            {},
            {
                onConnecting: () => console.log('🔗 Connecting to GoldRush streaming...'),
                onOpened: () => console.log('✅ Connected to GoldRush streaming!'),
                onClosed: () => console.log('🔌 Disconnected from GoldRush streaming'),
                onError: (error) => console.error('❌ GoldRush streaming error:', error),
            }
        );
    }
    return goldRushClient;
}

// Price update data structure
export interface PriceUpdate {
    pairAddress: string;
    tokenAddress?: string;
    price: number;
    priceUsd: number;
    volume: number;
    volumeUsd: number;
    liquidity: number;
    marketCap: number;
    priceDeltas: {
        last5m: number;
        last1hr: number;
        last6hr: number;
        last24hr: number;
    };
    timestamp: string;
}

// WETH address on Base for ETH price
const WETH_BASE = '0x4200000000000000000000000000000000000006';

// Subscribe to token OHLCV prices (better for actual USD prices)
export function subscribeToTokenPrices(
    chainName: string,
    tokenAddresses: string[],
    onData: (data: PriceUpdate[]) => void,
    onError?: (error: any) => void
): () => void {
    const client = getGoldRushClient();

    const query = `subscription {
    ohlcvCandlesForToken(
      chain_name: ${chainName}
      token_addresses: [${tokenAddresses.map(addr => `"${addr}"`).join(', ')}]
      interval: ONE_MINUTE
      timeframe: ONE_HOUR
    ) {
      chain_name
      timestamp
      open
      high
      low
      close
      volume
      volume_usd
      quote_rate
      quote_rate_usd
      base_token {
        contract_name
        contract_address
        contract_ticker_symbol
      }
    }
  }`;

    const unsubscribe = (client.StreamingService as any).rawQuery(
        query,
        {},
        {
            next: (data: any) => {
                console.log('RAW GoldRush OHLCV Response:', JSON.stringify(data, null, 2));
                const rawData = data?.data?.ohlcvCandlesForToken;
                if (rawData) {
                    const candlesArray = Array.isArray(rawData) ? rawData : [rawData];

                    const updates: PriceUpdate[] = candlesArray.map((candle: any) => ({
                        pairAddress: candle.base_token?.contract_address?.toLowerCase() || '',
                        tokenAddress: candle.base_token?.contract_address?.toLowerCase() || '',
                        price: candle.close || 0,
                        // quote_rate_usd is the USD price of the token
                        priceUsd: candle.quote_rate_usd || candle.close || 0,
                        volume: candle.volume || 0,
                        volumeUsd: candle.volume_usd || 0,
                        liquidity: 0,
                        marketCap: 0,
                        priceDeltas: {
                            last5m: 0,
                            last1hr: 0,
                            last6hr: 0,
                            last24hr: 0,
                        },
                        timestamp: candle.timestamp,
                    }));
                    onData(updates);
                }
            },
            error: (err: any) => {
                console.error('OHLCV Subscription error:', JSON.stringify(err, null, 2));
                onError?.(err);
            },
            complete: () => {
                console.log('OHLCV Subscription completed');
            },
        }
    );

    return unsubscribe;
}

// Subscribe to pair price updates
export function subscribeToUpdatePairs(
    chainName: string,
    pairAddresses: string[],
    onData: (data: PriceUpdate[]) => void,
    onError?: (error: any) => void
): () => void {
    const client = getGoldRushClient();

    const query = `subscription {
    updatePairs(
      chain_name: ${chainName}
      pair_addresses: [${pairAddresses.map(addr => `"${addr}"`).join(', ')}]
    ) {
      chain_name
      pair_address
      timestamp
      quote_rate
      quote_rate_usd
      liquidity
      price_deltas {
        last_5m
        last_1hr
        last_6hr
        last_24hr
      }
    }
  }`;

    const unsubscribe = (client.StreamingService as any).rawQuery(
        query,
        {},
        {
            next: (data: any) => {
                console.log('RAW GoldRush Response:', JSON.stringify(data, null, 2));
                const rawData = data?.data?.updatePairs;
                if (rawData) {
                    // Normalize to array (API might return single object or array)
                    const pairsArray = Array.isArray(rawData) ? rawData : [rawData];

                    const updates: PriceUpdate[] = pairsArray.map((pair: any) => ({
                        pairAddress: pair.pair_address.toLowerCase(), // Normalize to lowercase
                        price: pair.quote_rate, // Exchange rate (USDC per ETH for ETH/USDC pair)
                        // For ETH/USDC pair: quote_rate IS the USD price since USDC ≈ $1
                        priceUsd: pair.quote_rate, // Use quote_rate as the display price
                        volume: 0,
                        volumeUsd: 0,
                        liquidity: pair.liquidity,
                        marketCap: 0,
                        priceDeltas: {
                            last5m: pair.price_deltas?.last_5m || 0,
                            last1hr: pair.price_deltas?.last_1hr || 0,
                            last6hr: pair.price_deltas?.last_6hr || 0,
                            last24hr: pair.price_deltas?.last_24hr || 0,
                        },
                        timestamp: pair.timestamp,
                    }));
                    onData(updates);
                }
            },
            error: (err: any) => {
                console.error('Subscription error:', JSON.stringify(err, null, 2));
                onError?.(err);
            },
            complete: () => {
                console.log('Subscription completed');
            },
        }
    );

    return unsubscribe;
}

// OHLCV Candle data structure
export interface OHLCVCandle {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    volumeUsd: number;
    quoteRate: number;
    quoteRateUsd: number;
}

// Subscribe to OHLCV token price stream
export function subscribeToOHLCVTokens(
    chainName: string,
    tokenAddresses: string[],
    interval: string = 'ONE_MINUTE',
    timeframe: string = 'ONE_HOUR',
    onData: (data: OHLCVCandle[]) => void,
    onError?: (error: any) => void
): () => void {
    const client = getGoldRushClient();

    const query = `subscription {
    ohlcvCandlesForToken(
      chain_name: ${chainName}
      token_addresses: [${tokenAddresses.map(addr => `"${addr}"`).join(', ')}]
      interval: ${interval}
      timeframe: ${timeframe}
    ) {
      chain_name
      interval
      timeframe
      timestamp
      open
      high
      low
      close
      volume
      volume_usd
      quote_rate
      quote_rate_usd
      base_token {
        contract_name
        contract_address
        contract_decimals
        contract_ticker_symbol
      }
    }
  }`;

    const unsubscribe = (client.StreamingService as any).rawQuery(
        query,
        {},
        {
            next: (data: any) => {
                if (data?.data?.ohlcvCandlesForToken) {
                    const candles: OHLCVCandle[] = data.data.ohlcvCandlesForToken.map((candle: any) => ({
                        timestamp: candle.timestamp,
                        open: candle.open,
                        high: candle.high,
                        low: candle.low,
                        close: candle.close,
                        volume: candle.volume,
                        volumeUsd: candle.volume_usd,
                        quoteRate: candle.quote_rate,
                        quoteRateUsd: candle.quote_rate_usd,
                    }));
                    onData(candles);
                }
            },
            error: (err: any) => {
                console.error('OHLCV subscription error:', err);
                onError?.(err);
            },
            complete: () => {
                console.log('OHLCV subscription completed');
            },
        }
    );

    return unsubscribe;
}

// Disconnect streaming service
export async function disconnectStreaming(): Promise<void> {
    if (goldRushClient) {
        await (goldRushClient.StreamingService as any).disconnect();
        goldRushClient = null;
    }
}
