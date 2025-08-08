# Hedera DEX Plugin

A comprehensive Hedera DEX plugin for SaucerSwap integration with ElizaOS. This plugin provides real-time access to SaucerSwap V2 liquidity pools, token swapping capabilities, and complete DEX data from the Hedera blockchain.

## 🚀 Features

This plugin provides:

- **📊 Pool Management**: Fetches all liquidity pools from SaucerSwap V2
- **💱 Token Swapping**: Execute real token swaps on SaucerSwap DEX
- **🔍 Pool Information**: Get detailed information about specific trading pairs
- **⚡ Real-time Data**: Connects to Hedera Mirror Node for live blockchain data
- **🌐 Multi-network Support**: Works with both Hedera mainnet and testnet
- **🔗 Provider Integration**: Supplies contextual information about DEX capabilities
- **📈 Onchain Data**: No mocking - fetches real pool data from contract events
- **🏥 Health Monitoring**: Built-in health check and status endpoints

## 📁 Structure

```
plugin-hedera-dex/
├── src/
│   ├── __tests__/              # Unit tests
│   │   ├── plugin.test.ts
│   │   └── test-utils.ts
│   ├── plugin.ts               # Main plugin implementation
│   ├── saucerswap-abi.ts      # SaucerSwap contract ABIs
│   ├── manual-test.ts         # Manual testing utilities
│   └── index.ts               # Plugin export
├── scripts/
│   └── install-test-deps.js   # Test dependency installer
├── dist/                      # Compiled output
│   ├── index.js
│   └── index.d.ts
├── tsup.config.ts            # Build configuration
├── tsconfig.json             # TypeScript config
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ or Bun
- ElizaOS framework
- Hedera testnet/mainnet account (for real swaps)
- OpenAI or Anthropic API key

### **Installation**

1. **Clone or install the plugin:**
   ```bash
   # If part of the main project
   cd plugin-hedera-dex
   npm install
   ```

2. **Build the plugin:**
   ```bash
   npm run build
   ```

3. **Configure environment variables:**
   ```bash
   # In your main project .env file
   HEDERA_NETWORK=testnet
   HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

   # Optional: For real swaps
   HEDERA_PRIVATE_KEY=your_private_key
   HEDERA_ACCOUNT_ID=0.0.your_account_id
   ```

## 💬 Usage

### **Available Actions**

#### 1. **List Pools** (`LIST_POOLS`)
Fetches all liquidity pools from SaucerSwap V2.

**Trigger phrases:**
- "Show me all the liquidity pools on SaucerSwap"
- "What pools are available for trading?"
- "List pools" / "Get pools" / "Show pools"
- "SaucerSwap pools"

**What it does:**
1. Connects to the Hedera Mirror Node
2. Queries the SaucerSwap V2 Factory contract for pool creation events
3. Parses pool data including token pairs, fees, and liquidity information
4. Returns formatted pool information with contract IDs and token details

#### 2. **Get Pool Info** (`GET_POOL_INFO`)
Get detailed information about a specific trading pair.

**Trigger phrases:**
- "Show WHBAR/USDC pool details"
- "Get pool info for SAUCE and XSAUCE"
- "What are the details of the HBAR/USDT pool?"

#### 3. **Swap Tokens** (`SWAP_TOKENS`)
Execute token swaps on SaucerSwap DEX.

**Trigger phrases:**
- "Swap 10 HBAR for USDT"
- "Trade 100 USDC for SAUCE"
- "Exchange 5.5 WHBAR to BONZO"

**Features:**
- Real swap execution on testnet/mainnet
- Automatic token association if needed
- Slippage protection
- Transaction confirmation

### **API Endpoints**

The plugin provides REST API endpoints:

- **`GET /`** - Health check endpoint
- **`GET /api/status`** - Plugin status information

### **Configuration**

Set environment variables in your `.env` file:

```env
# Network Configuration
HEDERA_NETWORK=testnet  # or mainnet
HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

# Wallet Configuration (for real swaps)
HEDERA_PRIVATE_KEY=your_private_key_here
HEDERA_ACCOUNT_ID=0.0.your_account_id

# Optional: Demo mode (uses mock data)
DEMO_MODE=false
```

**Supported Networks:**
- **Mainnet**: Factory contract `0.0.3946833`
- **Testnet**: Factory contract `0.0.1197038`

## ✨ Key Features

### **🔗 Blockchain Integration**
- Direct integration with Hedera Hashgraph network
- Real-time data from Hedera Mirror Node API
- Support for both mainnet and testnet environments
- Actual on-chain transaction execution

### **💱 DEX Functionality**
- Complete SaucerSwap V2 integration
- Pool discovery and liquidity information
- Token swapping with slippage protection
- Automatic token association handling

### **🏗️ Architecture**
- Minimal dependencies for fast deployment
- TypeScript with full type safety
- Modular plugin architecture
- RESTful API endpoints

### **🧪 Testing & Development**
- Comprehensive unit test suite
- Manual testing utilities
- Mock data support for development
- Built-in health monitoring

## Plugin Components

### Actions

Define agent capabilities:

```typescript
const myAction: Action = {
  name: 'MY_ACTION',
  description: 'Description of what this action does',
  validate: async (runtime, message, state) => {
    // Validation logic
    return true;
  },
  handler: async (runtime, message, state, options, callback) => {
    // Action implementation
    return { success: true, data: {} };
  },
};
```

### Services

Manage plugin state:

```typescript
export class MyService extends Service {
  static serviceType = 'my-service';

  async start() {
    // Initialize service
  }

  async stop() {
    // Cleanup
  }
}
```

### Providers

Supply contextual information:

```typescript
const myProvider: Provider = {
  name: 'MY_PROVIDER',
  description: 'Provides contextual data',
  get: async (runtime, message, state) => {
    return {
      text: 'Provider data',
      values: {},
      data: {},
    };
  },
};
```

### API Routes

Backend endpoints:

```typescript
routes: [
  {
    name: 'api-endpoint',
    path: '/api/endpoint',
    type: 'GET',
    handler: async (req, res) => {
      res.json({ data: 'response' });
    },
  },
];
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Run tests
npm test

# Format code
npm run format

# Manual testing
npm run manual-test
```

## 🚀 Deployment

### **Local Development**
```bash
# In your main project
npm run dev
```

### **Production Deployment**
The plugin is ready for deployment on platforms like Render, Vercel, or any Node.js hosting service.

**Environment Variables for Production:**
```env
NODE_ENV=production
HEDERA_NETWORK=mainnet
HEDERA_MIRROR_NODE_URL=https://mainnet-public.mirrornode.hedera.com
HEDERA_PRIVATE_KEY=your_production_private_key
HEDERA_ACCOUNT_ID=0.0.your_production_account
```

## Testing

Write unit tests in `src/__tests__/`:

```typescript
import { describe, it, expect } from 'bun:test';

describe('My Plugin', () => {
  it('should work correctly', () => {
    expect(true).toBe(true);
  });
});
```

## Publishing

1. Update `package.json` with your plugin details
2. Build your plugin: `bun run build`
3. Publish: `elizaos publish`

## 🔧 Technical Details

### **Dependencies**
- `@elizaos/core` - ElizaOS framework integration
- `@hashgraph/sdk` - Hedera SDK for blockchain operations
- `ethers` - Ethereum-compatible utilities for contract interaction
- `axios` - HTTP client for API requests
- `zod` - Runtime type validation

### **Supported Token Standards**
- **HBAR** - Native Hedera cryptocurrency
- **HTS Tokens** - Hedera Token Service fungible tokens
- **Wrapped HBAR (WHBAR)** - ERC-20 compatible HBAR

### **SaucerSwap Integration**
- **V2 Factory Contract**: Pool discovery and creation events
- **Router Contract**: Token swapping and liquidity operations
- **Pool Contracts**: Individual liquidity pool interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This plugin is part of the ElizaOS ecosystem and follows the same licensing terms.

## 🆘 Support

- **Documentation**: [ElizaOS Docs](https://elizaos.ai)
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Community**: Join the ElizaOS Discord community

---

**Built with ❤️ for the Hedera and ElizaOS communities**
