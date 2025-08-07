# Hedera DEX Plugin

A Hedera DEX plugin for SaucerSwap integration with ElizaOS. This plugin provides real-time access to SaucerSwap V2 liquidity pools and DEX data from the Hedera blockchain.

## Overview

This plugin provides:

- **List Pools Action**: Fetches all liquidity pools from SaucerSwap V2
- **Real-time Data**: Connects to Hedera Mirror Node for live blockchain data
- **Multi-network Support**: Works with both Hedera mainnet and testnet
- **Provider Integration**: Supplies contextual information about DEX capabilities
- **Onchain Data**: No mocking - fetches real pool data from contract events

## Structure

```
plugin-hedera-dex/
├── src/
│   ├── __tests__/          # Unit tests
│   │   ├── plugin.test.ts
│   │   └── test-utils.ts
│   ├── plugin.ts           # Main plugin implementation
│   ├── tests.ts            # Plugin test suite
│   └── index.ts            # Plugin export
├── scripts/
│   └── install-test-deps.js # Test dependency installer
├── tsup.config.ts          # Build configuration
├── tsconfig.json           # TypeScript config
├── package.json            # Minimal dependencies
└── README.md               # This file
```

## Getting Started

1. **Create your plugin:**

   ```bash
   elizaos create my-plugin
   # Select: Plugin
   # Select: Quick Plugin (Backend Only)
   ```

2. **Navigate to your plugin:**

   ```bash
   cd my-plugin
   ```

3. **Install dependencies:**

   ```bash
   bun install
   ```

4. **Start development:**
   ```bash
   bun run dev
   ```

## Usage

### List Pools Action

The `LIST_POOLS` action fetches all liquidity pools from SaucerSwap V2. You can trigger it with various phrases:

- "Show me all the liquidity pools on SaucerSwap"
- "What pools are available for trading?"
- "List pools"
- "Get pools"
- "Show pools"
- "Fetch pools"
- "SaucerSwap pools"

The action will:
1. Connect to the Hedera Mirror Node
2. Query the SaucerSwap V2 Factory contract for pool creation events
3. Parse pool data including token pairs, fees, and liquidity information
4. Return formatted pool information with contract IDs and token details

### Configuration

Set environment variables in your `.env` file:

```env
HEDERA_NETWORK=mainnet  # or testnet
HEDERA_MIRROR_NODE_URL=https://mainnet-public.mirrornode.hedera.com  # optional, defaults based on network
```

**Supported Networks:**
- **Mainnet**: Factory contract `0.0.3946833`
- **Testnet**: Factory contract `0.0.1197038`

## Key Features

### Minimal Dependencies

- Only essential packages (`@elizaos/core`, `zod`)
- No frontend frameworks or build tools
- Fast installation and builds

### Simple Testing

- Unit tests only with Bun test runner
- No E2E or component testing overhead
- Quick test execution

### Backend Focus

- API routes for server-side functionality
- Services for state management
- Actions for agent capabilities
- Providers for contextual data

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

## Development Commands

```bash
# Start in development mode with hot reload
bun run dev

# Start in production mode
bun run start

# Build the plugin
bun run build

# Run tests
bun test

# Format code
bun run format
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

## When to Use Quick Starter

Use this template when you need:

- ✅ Backend-only functionality
- ✅ Simple API integrations
- ✅ Lightweight plugins
- ✅ Fast development cycles
- ✅ Minimal dependencies

Consider the full plugin-hedera-dex if you need:

- ❌ React frontend components
- ❌ Complex UI interactions
- ❌ E2E testing with Cypress
- ❌ Frontend build pipeline

## License

This template is part of the ElizaOS project.
