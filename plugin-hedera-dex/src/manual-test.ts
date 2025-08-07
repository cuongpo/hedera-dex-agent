#!/usr/bin/env bun

/**
 * Manual test script to verify the list_pools action works with real Hedera testnet data
 * Run with: bun run src/manual-test.ts
 */

import { hederaDexPlugin } from './index';
import { logger } from '@elizaos/core';

// Mock runtime that provides mainnet configuration
const mockRuntime = {
  getSetting: (key: string) => {
    switch (key) {
      case 'HEDERA_NETWORK':
        return 'mainnet';
      case 'HEDERA_MIRROR_NODE_URL':
        return 'https://mainnet-public.mirrornode.hedera.com';
      default:
        return undefined;
    }
  },
  // Add other required runtime methods as no-ops
  getMemory: () => null,
  setMemory: () => {},
  getState: () => ({}),
  setState: () => {},
  composeState: () => ({}),
  updateRecentMessageState: () => ({}),
  messageManager: null,
  descriptionManager: null,
  loreManager: null,
  documentsManager: null,
  knowledgeManager: null,
  services: new Map(),
  providers: [],
  actions: [],
  evaluators: [],
  plugins: [],
  fetch: global.fetch,
} as any;

// Mock memory object
const mockMessage = {
  id: 'test-message-id',
  userId: 'test-user',
  agentId: 'test-agent',
  roomId: 'test-room',
  content: {
    text: 'list all pools on saucerswap',
    source: 'manual-test',
  },
  createdAt: Date.now(),
} as any;

async function testListPoolsAction() {
  console.log('🧪 Testing LIST_POOLS action with real Hedera mainnet data...\n');

  try {
    // Get the list pools action
    const listPoolsAction = hederaDexPlugin.actions?.[0];
    
    if (!listPoolsAction) {
      throw new Error('LIST_POOLS action not found');
    }

    console.log(`✅ Found action: ${listPoolsAction.name}`);
    console.log(`📝 Description: ${listPoolsAction.description}`);
    console.log(`🎯 Similes: ${listPoolsAction.similes?.join(', ')}\n`);

    // Test validation
    console.log('🔍 Testing validation...');
    const isValid = await listPoolsAction.validate(mockRuntime, mockMessage, undefined);
    console.log(`✅ Validation result: ${isValid}\n`);

    // Test the handler with callback
    console.log('🚀 Executing action handler...');
    console.log('📡 Connecting to Hedera mainnet Mirror Node...');
    console.log('🏭 Querying SaucerSwap V2 Factory contract: 0.0.3946833\n');

    let callbackContent: any = null;

    const callback = async (content: any) => {
      callbackContent = content;
      console.log('📞 Callback received with pool data');
      return [];
    };

    const startTime = Date.now();
    const result = await listPoolsAction.handler(
      mockRuntime,
      mockMessage,
      undefined,
      undefined,
      callback
    );
    const endTime = Date.now();

    console.log(`⏱️  Execution time: ${endTime - startTime}ms\n`);

    // Display results
    if (result && result.success) {
      console.log('🎉 SUCCESS! Pool data retrieved successfully');
      console.log(`📊 Total pools found: ${result.data?.totalPools || 0}`);
      console.log(`🌐 Network: ${result.values?.network || 'unknown'}`);
      console.log(`📡 Data source: ${result.data?.dataSource || 'unknown'}\n`);

      if (callbackContent) {
        console.log('📋 Formatted pool information:');
        console.log('=' .repeat(80));
        console.log(callbackContent.text);
        console.log('=' .repeat(80));
      }

      if (result.data?.pools && result.data.pools.length > 0) {
        console.log('\n🔍 First pool details:');
        const firstPool = result.data.pools[0];
        console.log(`   Pool ID: ${firstPool.id}`);
        console.log(`   Contract: ${firstPool.contractId}`);
        console.log(`   Token A: ${firstPool.tokenA.name} (${firstPool.tokenA.symbol})`);
        console.log(`   Token B: ${firstPool.tokenB.name} (${firstPool.tokenB.symbol})`);
        console.log(`   Fee: ${firstPool.fee / 10000}%`);
        console.log(`   Liquidity: ${firstPool.liquidity}`);
      }

    } else {
      console.log('❌ FAILED! Error occurred:');
      const errorMsg = result?.error instanceof Error ? result.error.message : String(result?.error || 'Unknown error');
      console.log(`   Error: ${errorMsg}`);
      console.log(`   Details: ${result?.text || 'No details available'}`);

      if (result?.data && 'error' in result.data) {
        console.log(`   Additional info: ${result.data.error}`);
      }
    }

  } catch (error) {
    console.error('💥 Test failed with exception:', error);
    process.exit(1);
  }
}

async function testProvider() {
  console.log('\n🔧 Testing Hedera DEX Provider...');
  
  const provider = hederaDexPlugin.providers?.[0];
  if (!provider) {
    console.log('❌ Provider not found');
    return;
  }

  console.log(`✅ Found provider: ${provider.name}`);
  
  const providerResult = await provider.get(mockRuntime, mockMessage, {} as any);
  console.log('📋 Provider information:');
  console.log(`   Text: ${providerResult.text}`);
  console.log(`   Network: ${providerResult.values?.network || 'unknown'}`);
  console.log(`   Capabilities: ${providerResult.values?.capabilities?.join(', ') || 'none'}`);
  console.log(`   Supported networks: ${providerResult.data?.supportedNetworks?.join(', ') || 'none'}`);
}

// Run the tests
async function main() {
  console.log('🌊 Hedera DEX Plugin - Manual Test Suite');
  console.log('=' .repeat(50));
  
  await testListPoolsAction();
  await testProvider();
  
  console.log('\n✨ Manual test completed!');
}

// Execute if run directly
if (import.meta.main) {
  main().catch(console.error);
}
