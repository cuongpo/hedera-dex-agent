import { describe, expect, it, beforeEach, spyOn } from 'bun:test';
import { hederaDexPlugin } from '../index';
import {
  type IAgentRuntime,
  type Memory,
  type HandlerCallback,
  logger,
} from '@elizaos/core';
import {
  createMockRuntime,
  createTestMemory,
} from './test-utils';
import axios from 'axios';

// Mock axios for controlled testing
const mockAxios = spyOn(axios, 'get');

describe('Get Pool Info Action', () => {
  let runtime: IAgentRuntime;
  let getPoolInfoAction: any;
  let callbackResults: any[] = [];

  beforeEach(() => {
    callbackResults = [];
    
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
    
    getPoolInfoAction = hederaDexPlugin.actions?.find(action => action.name === 'GET_POOL_INFO');
    
    // Clear previous mock calls
    mockAxios.mockClear();
  });

  it('should have get pool info action', () => {
    expect(getPoolInfoAction).toBeDefined();
    expect(getPoolInfoAction?.name).toBe('GET_POOL_INFO');
    expect(getPoolInfoAction?.similes).toContain('POOL_INFO');
    expect(getPoolInfoAction?.similes).toContain('SHOW_POOL');
    expect(getPoolInfoAction?.similes).toContain('POOL_DETAILS');
  });

  it('should validate pool info queries correctly', async () => {
    if (!getPoolInfoAction?.validate) {
      throw new Error('Get pool info action validate not found');
    }

    const validMessages = [
      'Show WHBAR/USDC pool details',
      'Get pool info for SAUCE and XSAUCE',
      'What are the details of the WHBAR/BONZO pool?',
      'Pool details for HCHF/USDC',
      'Show me the WETH/WHBAR pair information'
    ];

    const invalidMessages = [
      'show me all pools', // no specific token pair
      'what is WHBAR?', // no pool keyword
      'list pools', // general pool request, not specific
      'hello world' // unrelated
    ];

    for (const text of validMessages) {
      const message = createTestMemory({
        content: { text, source: 'test' },
      });
      const isValid = await getPoolInfoAction.validate(runtime, message);
      expect(isValid).toBe(true);
    }

    for (const text of invalidMessages) {
      const message = createTestMemory({
        content: { text, source: 'test' },
      });
      const isValid = await getPoolInfoAction.validate(runtime, message);
      expect(isValid).toBe(false);
    }
  });

  it('should extract token pairs correctly', async () => {
    // Mock the contract logs response with WHBAR/USDC pool
    const mockLogsResponse = {
      data: {
        logs: [
          {
            topics: [
              '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118', // Pool created topic
              '0x0000000000000000000000000000000000000000000000000000000000001234', // WHBAR token
              '0x0000000000000000000000000000000000000000000000000000000000005678', // USDC token
              '0x0000000000000000000000000000000000000000000000000000000000000bb8', // fee (3000)
            ],
            data: '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000409abc123400000000000000000000000000000000000000000000000000000000',
          }
        ]
      }
    };

    // Mock token info responses
    const mockWHBARResponse = {
      data: {
        decimals: 8,
        name: 'Wrapped HBAR',
        symbol: 'WHBAR',
      }
    };

    const mockUSDCResponse = {
      data: {
        decimals: 6,
        name: 'USD Coin',
        symbol: 'USDC',
      }
    };

    // Set up axios mocks
    mockAxios
      .mockResolvedValueOnce(mockLogsResponse) // Contract logs call
      .mockResolvedValueOnce(mockWHBARResponse) // WHBAR token info
      .mockResolvedValueOnce(mockUSDCResponse); // USDC token info

    const message = createTestMemory({
      content: { text: 'Show WHBAR/USDC pool details', source: 'test' },
    });

    const callback: HandlerCallback = async (content) => {
      callbackResults.push(content);
      return [];
    };

    const result = await getPoolInfoAction.handler(
      runtime,
      message,
      undefined,
      undefined,
      callback
    );

    // Verify the result structure
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.actionName).toBe('GET_POOL_INFO');
    expect(result.data.tokenPair).toBe('WHBAR/USDC');
    expect(result.data.pools).toBeDefined();
    expect(result.values.tokenPair).toBe('WHBAR/USDC');

    // Verify callback was called with pool information
    expect(callbackResults).toHaveLength(1);
    expect(callbackResults[0].text).toContain('Pool Information for WHBAR/USDC');
    expect(callbackResults[0].text).toContain('WHBAR/USDC Pool');
    expect(callbackResults[0].text).toContain('Fee Tier:** 0.30%');
  });

  it('should handle "and" format token pairs', async () => {
    const message = createTestMemory({
      content: { text: 'Get pool info for SAUCE and XSAUCE', source: 'test' },
    });

    // Mock empty response to test token extraction without network calls
    mockAxios.mockRejectedValueOnce(new Error('Network error'));

    const result = await getPoolInfoAction.handler(
      runtime,
      message,
      undefined,
      undefined,
      undefined
    );

    // Should fail due to network error, but token extraction should work
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle pool not found scenario', async () => {
    // Mock empty logs response
    mockAxios.mockResolvedValueOnce({
      data: { logs: [] }
    });

    const message = createTestMemory({
      content: { text: 'Show FAKE/TOKEN pool details', source: 'test' },
    });

    const result = await getPoolInfoAction.handler(
      runtime,
      message,
      undefined,
      undefined,
      undefined
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.text).toContain('No pools found for FAKE/TOKEN');
  });

  it('should handle multiple pools for same token pair', async () => {
    // Mock response with multiple pools for same token pair (different fees)
    const mockLogsResponse = {
      data: {
        logs: [
          {
            topics: [
              '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118',
              '0x0000000000000000000000000000000000000000000000000000000000001234', // token0
              '0x0000000000000000000000000000000000000000000000000000000000005678', // token1
              '0x0000000000000000000000000000000000000000000000000000000000000bb8', // 3000 = 0.30%
            ],
            data: '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000409abc123400000000000000000000000000000000000000000000000000000000',
          },
          {
            topics: [
              '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118',
              '0x0000000000000000000000000000000000000000000000000000000000001234', // same token0
              '0x0000000000000000000000000000000000000000000000000000000000005678', // same token1
              '0x00000000000000000000000000000000000000000000000000000000000001f4', // 500 = 0.05%
            ],
            data: '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000405678abcd00000000000000000000000000000000000000000000000000000000',
          }
        ]
      }
    };

    // Mock token responses
    mockAxios
      .mockResolvedValueOnce(mockLogsResponse)
      .mockResolvedValueOnce({ data: { decimals: 8, name: 'Token A', symbol: 'TKNA' } })
      .mockResolvedValueOnce({ data: { decimals: 6, name: 'Token B', symbol: 'TKNB' } })
      .mockResolvedValueOnce({ data: { decimals: 8, name: 'Token A', symbol: 'TKNA' } })
      .mockResolvedValueOnce({ data: { decimals: 6, name: 'Token B', symbol: 'TKNB' } });

    const message = createTestMemory({
      content: { text: 'Show TKNA/TKNB pool details', source: 'test' },
    });

    const callback: HandlerCallback = async (content) => {
      callbackResults.push(content);
      return [];
    };

    const result = await getPoolInfoAction.handler(
      runtime,
      message,
      undefined,
      undefined,
      callback
    );

    expect(result.success).toBe(true);
    expect(result.data.pools.length).toBe(2);
    expect(result.values.poolCount).toBe(2);

    // Check callback content shows multiple pools
    const callbackText = callbackResults[0].text;
    expect(callbackText).toContain('Found 2 pools for this token pair');
    expect(callbackText).toContain('0.30% fee');
    expect(callbackText).toContain('0.05% fee');
  });
});
