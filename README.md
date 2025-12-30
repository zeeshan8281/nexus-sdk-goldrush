# 🌉 Cross-Chain Router Dashboard

<div align="center">

![Nexus + GoldRush](https://img.shields.io/badge/Powered%20by-Nexus%20%2B%20GoldRush-blueviolet?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A production-ready MVP showcasing real-time cross-chain bridging with live market data streaming**

[Demo](#-demo-flow) • [Quick Start](#-quick-start) • [Features](#-key-features) • [Architecture](#-architecture)

</div>

---

## ✨ What is this?

This dashboard demonstrates the powerful combination of **[Avail Nexus SDK](https://docs.availproject.org/category/avail-nexus)** for cross-chain operations and **[GoldRush Streaming API](https://goldrush.dev/)** for real-time market data. It's a complete working example of:

- 🔗 **Unified Balance Management** - View tokens across all supported chains in one place
- ⚡ **Fast Cross-Chain Bridging** - Execute bridge transactions with live execution tracking
- 📊 **Real-Time Price Feeds** - WebSocket-powered live price updates from DEX pools
- 🎯 **Zero Mocks** - All data comes from actual blockchain sources

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm** or **pnpm**

### Installation

```bash
# Clone the repository
git clone https://github.com/zeeshan8281/nexus-sdk-goldrush.git

# Navigate to the project
cd nexus-sdk-goldrush

# Install dependencies
npm install

# Copy environment example
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with your API keys:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_GOLDRUSH_API_KEY=your_goldrush_api_key
```

**Get your API keys:**
| Service | Link |
|---------|------|
| WalletConnect | [cloud.walletconnect.com](https://cloud.walletconnect.com/) |
| GoldRush | [goldrush.dev/register](https://goldrush.dev/platform/auth/register/) |

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your wallet!

---

## 🌟 Key Features

### 1. Unified Cross-Chain Balances

<table>
<tr>
<td width="60%">

View your token balances across **all supported chains** in a single, unified interface. The Nexus SDK aggregates your holdings from:

- Ethereum Mainnet
- Arbitrum
- Base
- Optimism
- Polygon
- And more...

</td>
<td>

```typescript
// Get all balances in one call
const balances = await sdk.getUnifiedBalances(true);
```

</td>
</tr>
</table>

### 2. Fast Bridge with Real Execution

<table>
<tr>
<td width="60%">

Execute cross-chain bridge transactions with:

- **Smart routing** - Automatic best-path finding
- **Fee transparency** - Complete breakdown before execution
- **Live progress** - Real-time transaction status updates
- **Multi-step tracking** - Follow each bridge step

</td>
<td>

```typescript
// Build and execute route
const intent = await sdk.createBridgeIntent({
  fromChain: 'ethereum',
  toChain: 'base',
  token: 'ETH',
  amount: '0.1'
});

await sdk.executeBridgeIntent(intent);
```

</td>
</tr>
</table>

### 3. Real-Time Market Data

<table>
<tr>
<td width="60%">

GoldRush Streaming API provides WebSocket-powered live data:

- **Live price tickers** from DEX pools
- **Price change indicators** (5m, 1hr, 24hr)
- **Liquidity monitoring**
- **Volume tracking**

</td>
<td>

```typescript
// Subscribe to live prices
subscribeToUpdatePairs(
  'BASE_MAINNET',
  ['0x88a43b...'], // ETH/USDC pair
  (updates) => {
    console.log('Price:', updates[0].priceUsd);
  }
);
```

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Next.js 16 Frontend                        │
│                        (React 19 + TypeScript)                      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐│
│  │   RainbowKit    │  │   Nexus SDK     │  │ GoldRush Streaming  ││
│  │  + Wagmi + Viem │  │   Elements      │  │       API           ││
│  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘│
│           │                    │                       │           │
│     ┌─────▼─────┐        ┌─────▼─────┐          ┌─────▼─────┐     │
│     │  Wallet   │        │  Bridge   │          │   Live    │     │
│     │  Connect  │        │  Execute  │          │  Prices   │     │
│     │  Sign Tx  │        │  Balances │          │  OHLCV    │     │
│     └───────────┘        └───────────┘          └───────────┘     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Global styles + Tailwind
│
├── components/
│   ├── fast-bridge/       # Bridge UI components
│   │   ├── fast-bridge.tsx
│   │   ├── chain-select.tsx
│   │   ├── token-select.tsx
│   │   ├── amount-input.tsx
│   │   ├── fee-breakdown.tsx
│   │   └── transaction-progress.tsx
│   │
│   ├── unified-balance/   # Balance display components
│   │   └── unified-balance.tsx
│   │
│   ├── nexus/             # Nexus SDK provider
│   │   └── NexusProvider.tsx
│   │
│   ├── LivePricePanel.tsx # Real-time price display
│   ├── WalletConnect.tsx  # Wallet connection
│   └── ui/                # Shared UI components (shadcn/ui)
│
├── lib/
│   ├── nexus.ts           # Nexus SDK initialization
│   ├── goldrush.ts        # GoldRush streaming wrapper
│   └── utils.ts           # Utility functions
│
└── providers/
    ├── Web3Provider.tsx   # RainbowKit + Wagmi setup
    ├── NexusProvider.tsx  # Nexus SDK context
    └── StreamProvider.tsx # GoldRush streaming context
```

---

## 🔧 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 16.1 | React framework with App Router |
| [React](https://react.dev/) | 19.2 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety |
| [@avail-project/nexus-core](https://www.npmjs.com/package/@avail-project/nexus-core) | 1.0.0-beta | Cross-chain SDK |
| [@covalenthq/client-sdk](https://www.npmjs.com/package/@covalenthq/client-sdk) | 2.3 | GoldRush streaming |
| [@rainbow-me/rainbowkit](https://www.rainbowkit.com/) | 2.2 | Wallet connection |
| [wagmi](https://wagmi.sh/) | 2.19 | React hooks for Ethereum |
| [viem](https://viem.sh/) | 2.43 | TypeScript Ethereum library |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | - | UI components |

---

## 📝 API Integration Examples

### Nexus SDK - Cross-Chain Operations

```typescript
import { NexusSDK } from '@avail-project/nexus-core';

// Initialize SDK with wallet provider
const sdk = new NexusSDK();
await sdk.initialize(ethereumProvider);

// Get unified balances across all chains
const balances = await sdk.getUnifiedBalances(true);
console.log('Total value:', balances.totalValueUsd);

// Create bridge intent
const intent = await sdk.createBridgeIntent({
  fromChain: 'arbitrum',
  toChain: 'base',
  token: 'ETH',
  amount: '0.5',
  recipient: '0x...'
});

// Execute with progress tracking
await sdk.executeBridgeIntent(intent, {
  onStep: (step) => console.log('Step:', step.status),
  onComplete: () => console.log('Bridge complete!')
});
```

### GoldRush Streaming - Live Market Data

```typescript
import { GoldRushClient } from '@covalenthq/client-sdk';

// Initialize with streaming callbacks
const client = new GoldRushClient(apiKey, {}, {
  onOpened: () => console.log('Connected!'),
  onError: (err) => console.error('Error:', err)
});

// Subscribe to real-time pair updates
const unsubscribe = client.StreamingService.rawQuery(`
  subscription {
    updatePairs(
      chain_name: BASE_MAINNET
      pair_addresses: ["0x88a43bbdf9d098eec7bceda4e2494615dfd9bb9c"]
    ) {
      pair_address
      quote_rate_usd
      liquidity
      price_deltas {
        last_5m
        last_1hr
        last_24hr
      }
    }
  }
`, {}, {
  next: (data) => console.log('Price update:', data),
  error: (err) => console.error('Stream error:', err)
});

// Cleanup on unmount
return () => unsubscribe();
```

---

## 🎬 Demo Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CONNECT WALLET                                              │
│     └─> RainbowKit modal → Sign → "Nexus Ready" badge appears   │
├─────────────────────────────────────────────────────────────────┤
│  2. VIEW BALANCES                                               │
│     └─> Unified balance panel loads showing cross-chain tokens  │
├─────────────────────────────────────────────────────────────────┤
│  3. WATCH LIVE PRICES                                           │
│     └─> GoldRush stream shows real-time ETH/USDC from Base      │
│         with live price deltas (▲/▼ indicators)                 │
├─────────────────────────────────────────────────────────────────┤
│  4. BUILD BRIDGE                                                │
│     └─> Select chain → Select token → Enter amount              │
│     └─> Fee breakdown appears with source chain detection       │
├─────────────────────────────────────────────────────────────────┤
│  5. EXECUTE BRIDGE                                              │
│     └─> Accept → Sign transaction → Progress timeline           │
│     └─> Step-by-step tracking until completion                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Development

### Build for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Avail Project](https://www.availproject.org/)** - For the incredible Nexus SDK enabling seamless cross-chain operations
- **[Covalent / GoldRush](https://www.covalenthq.com/)** - For the powerful real-time blockchain data streaming API
- **[RainbowKit](https://www.rainbowkit.com/)** - For the beautiful wallet connection experience
- **[shadcn/ui](https://ui.shadcn.com/)** - For the elegant UI component library

---

<div align="center">

**Built with ❤️ for the Nexus + GoldRush integration demo**

[![GitHub](https://img.shields.io/badge/GitHub-zeeshan8281-181717?style=flat-square&logo=github)](https://github.com/zeeshan8281)

</div>
