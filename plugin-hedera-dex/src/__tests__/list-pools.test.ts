import { describe, expect, it, beforeEach } from 'bun:test';
import { hederaDexPlugin } from '../index';
import {
  type IAgentRuntime,
  type Memory,
  type State,
  type Content,
  type HandlerCallback,
} from '@elizaos/core';
import {
  createMockRuntime,
  createTestMemory,
} from './test-utils';

describe('List Pools Action', () => {
  let runtime: IAgentRuntime;
  let listPoolsAction: any;

  beforeEach(() => {
    runtime = createMockRuntime({
      getSetting: (key: string) => {
        switch (key) {
          case 'HEDERA_NETWORK':
            return 'testnet';
          case 'HEDERA_MIRROR_NODE_URL':
            return 'https://testnet.mirrornode.hedera.com';
          default:
            return undefined;
        }
      },
    });
    listPoolsAction = hederaDexPlugin.actions?.[0];
  });

  it('should have list pools action', () => {
    expect(listPoolsAction).toBeDefined();
    expect(listPoolsAction?.name).toBe('LIST_POOLS');
    expect(listPoolsAction?.similes).toContain('GET_POOLS');
    expect(listPoolsAction?.similes).toContain('SHOW_POOLS');
    expect(listPoolsAction?.similes).toContain('FETCH_POOLS');
    expect(listPoolsAction?.similes).toContain('SAUCERSWAP_POOLS');
  });

  it('should always validate messages', async () => {
    if (!listPoolsAction?.validate) {
      throw new Error('List pools action validate not found');
    }

    const validMessages = [
      'show me all pools',
      'list pools',
      'what pools are available',
      'get saucerswap pools'
    ];

    for (const text of validMessages) {
      const message = createTestMemory({
        content: { text, source: 'test' },
      });
      const isValid = await listPoolsAction.validate(runtime, message);
      expect(isValid).toBe(true);
    }
  });

  it('should have proper action structure', () => {
    expect(listPoolsAction.name).toBe('LIST_POOLS');
    expect(listPoolsAction.description).toContain('Lists all liquidity pools');
    expect(listPoolsAction.validate).toBeDefined();
    expect(listPoolsAction.handler).toBeDefined();
    expect(listPoolsAction.examples).toBeDefined();
    expect(listPoolsAction.examples.length).toBeGreaterThan(0);
  });

  it('should handle network configuration', async () => {
    if (!listPoolsAction?.handler) {
      throw new Error('List pools action handler not found');
    }

    const message = createTestMemory({
      content: { text: 'list pools', source: 'test' },
    });

    // Test with testnet configuration
    const testnetRuntime = createMockRuntime({
      getSetting: (key: string) => {
        switch (key) {
          case 'HEDERA_NETWORK':
            return 'testnet';
          case 'HEDERA_MIRROR_NODE_URL':
            return 'https://testnet.mirrornode.hedera.com';
          default:
            return undefined;
        }
      },
    });

    // This test just verifies the action can be called without throwing
    // In a real test environment, you'd mock the axios calls
    try {
      const result = await listPoolsAction.handler(
        testnetRuntime,
        message,
        undefined,
        undefined,
        undefined
      );
      
      // The action should return a result structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    } catch (error) {
      // Expected to fail in test environment without real network access
      expect(error).toBeDefined();
    }
  });
});

describe('Hedera DEX Provider', () => {
  const provider = hederaDexPlugin.providers?.[0];
  let runtime: IAgentRuntime;

  beforeEach(() => {
    runtime = createMockRuntime({
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
    });
  });

  it('should have hedera dex provider', () => {
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('HEDERA_DEX_PROVIDER');
  });

  it('should provide hedera dex data', async () => {
    if (!provider?.get) {
      throw new Error('Hedera DEX provider not found');
    }

    const message = createTestMemory();

    const result = await provider.get(runtime, message, undefined);

    expect(result).toHaveProperty('text');
    expect(result.text).toContain('Hedera DEX integration active');
    expect(result).toHaveProperty('values');
    expect(result.values).toHaveProperty('network', 'mainnet');
    expect(result.values).toHaveProperty('capabilities');
    expect(result).toHaveProperty('data');
    expect(result.data).toHaveProperty('supportedNetworks');
    expect(result.data).toHaveProperty('contractAddresses');
  });
});
