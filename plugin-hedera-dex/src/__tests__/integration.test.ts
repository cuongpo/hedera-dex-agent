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

describe('List Pools Action Integration Test', () => {
  let runtime: IAgentRuntime;
  let listPoolsAction: any;
  let callbackResults: any[] = [];

  beforeEach(() => {
    callbackResults = [];
    
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
    
    // Clear previous mock calls
    mockAxios.mockClear();
  });

  it('should successfully fetch and parse pool data', async () => {
    // Mock the contract logs response
    const mockLogsResponse = {
      data: {
        logs: [
          {
            topics: [
              '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118', // Pool created topic
              '0x0000000000000000000000000000000000000000000000000000000000001234', // token0
              '0x0000000000000000000000000000000000000000000000000000000000005678', // token1
              '0x0000000000000000000000000000000000000000000000000000000000000bb8', // fee (3000)
            ],
            data: '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000409abc123400000000000000000000000000000000000000000000000000000000',
          }
        ]
      }
    };

    // Mock token info responses
    const mockToken0Response = {
      data: {
        decimals: 8,
        name: 'Wrapped HBAR',
        symbol: 'WHBAR',
      }
    };

    const mockToken1Response = {
      data: {
        decimals: 6,
        name: 'USD Coin',
        symbol: 'USDC',
      }
    };

    // Set up axios mocks in order
    mockAxios
      .mockResolvedValueOnce(mockLogsResponse) // Contract logs call
      .mockResolvedValueOnce(mockToken0Response) // Token 0 info
      .mockResolvedValueOnce(mockToken1Response); // Token 1 info

    const message = createTestMemory({
      content: { text: 'list all pools', source: 'test' },
    });

    const callback: HandlerCallback = async (content) => {
      callbackResults.push(content);
      return [];
    };

    const result = await listPoolsAction.handler(
      runtime,
      message,
      undefined,
      undefined,
      callback
    );

    // Verify the result structure
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.actionName).toBe('LIST_POOLS');
    expect(result.data.pools).toBeDefined();
    expect(result.data.totalPools).toBeGreaterThan(0);

    // Verify callback was called with pool information
    expect(callbackResults).toHaveLength(1);
    expect(callbackResults[0].text).toContain('SaucerSwap V2 Liquidity Pools');
    expect(callbackResults[0].text).toContain('WHBAR/USDC');
    expect(callbackResults[0].text).toContain('Fee Tier: 0.30%');

    // Verify axios was called correctly
    expect(mockAxios).toHaveBeenCalledTimes(3);
    expect(mockAxios).toHaveBeenNthCalledWith(1, 
      'https://testnet.mirrornode.hedera.com/api/v1/contracts/0.0.1197038/results/logs?limit=100'
    );
  });

  it('should handle network configuration correctly', async () => {
    // Test with mainnet configuration
    const mainnetRuntime = createMockRuntime({
      getSetting: (key: string) => {
        switch (key) {
          case 'HEDERA_NETWORK':
            return 'mainnet';
          case 'HEDERA_MIRROR_NODE_URL':
            return undefined; // Should use default
          default:
            return undefined;
        }
      },
    });

    // Mock empty response to avoid actual network calls
    mockAxios.mockRejectedValueOnce(new Error('Network error'));

    const message = createTestMemory({
      content: { text: 'show pools', source: 'test' },
    });

    const result = await listPoolsAction.handler(
      mainnetRuntime,
      message,
      undefined,
      undefined,
      undefined
    );

    // Should fail gracefully
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // Verify it tried to call mainnet factory contract
    expect(mockAxios).toHaveBeenCalledWith(
      expect.stringContaining('mainnet-public.mirrornode.hedera.com')
    );
    expect(mockAxios).toHaveBeenCalledWith(
      expect.stringContaining('0.0.3946833') // Mainnet factory
    );
  });

  it('should handle empty pool results', async () => {
    // Mock empty logs response
    mockAxios.mockResolvedValueOnce({
      data: { logs: [] }
    });

    const message = createTestMemory({
      content: { text: 'get pools', source: 'test' },
    });

    const result = await listPoolsAction.handler(
      runtime,
      message,
      undefined,
      undefined,
      undefined
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.data.error).toContain('No pools found');
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    mockAxios.mockRejectedValueOnce(new Error('Mirror Node API error'));

    const message = createTestMemory({
      content: { text: 'fetch pools', source: 'test' },
    });

    const result = await listPoolsAction.handler(
      runtime,
      message,
      undefined,
      undefined,
      undefined
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.text).toContain('Failed to fetch pools');
  });

  it('should validate different trigger phrases', async () => {
    const triggerPhrases = [
      'list pools',
      'show me all pools',
      'get saucerswap pools',
      'what pools are available',
      'fetch all pools'
    ];

    for (const phrase of triggerPhrases) {
      const message = createTestMemory({
        content: { text: phrase, source: 'test' },
      });

      const isValid = await listPoolsAction.validate(runtime, message, undefined);
      expect(isValid).toBe(true);
    }
  });

  it('should format pool information correctly', async () => {
    // Mock response with multiple pools
    const mockLogsResponse = {
      data: {
        logs: [
          {
            topics: [
              '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118',
              '0x0000000000000000000000000000000000000000000000000000000000001234',
              '0x0000000000000000000000000000000000000000000000000000000000005678',
              '0x0000000000000000000000000000000000000000000000000000000000000bb8', // 3000 = 0.30%
            ],
            data: '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000409abc123400000000000000000000000000000000000000000000000000000000',
          },
          {
            topics: [
              '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118',
              '0x0000000000000000000000000000000000000000000000000000000000009abc',
              '0x0000000000000000000000000000000000000000000000000000000000000def',
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
      .mockResolvedValueOnce({ data: { decimals: 18, name: 'Token C', symbol: 'TKNC' } })
      .mockResolvedValueOnce({ data: { decimals: 8, name: 'Token D', symbol: 'TKND' } });

    const message = createTestMemory({
      content: { text: 'show all pools', source: 'test' },
    });

    const callback: HandlerCallback = async (content) => {
      callbackResults.push(content);
      return [];
    };

    const result = await listPoolsAction.handler(
      runtime,
      message,
      undefined,
      undefined,
      callback
    );

    expect(result.success).toBe(true);
    expect(result.data.totalPools).toBe(2);

    // Check callback content formatting
    const callbackText = callbackResults[0].text;
    expect(callbackText).toContain('Found 2 active pools');
    expect(callbackText).toContain('TKNA/TKNB');
    expect(callbackText).toContain('TKNC/TKND');
    expect(callbackText).toContain('Fee Tier: 0.30%');
    expect(callbackText).toContain('Fee Tier: 0.05%');
  });
});
