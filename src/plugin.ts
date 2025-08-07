import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type ActionResult,
  type Content,
  type GenerateTextParams,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type Provider,
  type ProviderResult,
  Service,
  type State,
  logger,
} from '@elizaos/core';
import { z } from 'zod';
import axios from 'axios';

// TypeScript interfaces for SaucerSwap API responses
interface ApiToken {
  decimals: number;
  icon?: string;
  id: string;
  name: string;
  price: string;
  priceUsd: number;
  symbol: string;
  dueDiligenceComplete: boolean;
  isFeeOnTransferToken: boolean;
  timestampSecondsLastListingChange: number;
  description: string | null;
  website: string | null;
  twitterHandle: string | null;
  sentinelReport: string | null;
}

interface ApiLiquidityPoolV2 {
  id: number;
  contractId: string;
  tokenA: ApiToken;
  amountA: string; // total amount for tokenA, in smallest unit
  tokenB: ApiToken;
  amountB: string; // total amount for tokenB, in smallest unit
  fee: number;
  sqrtRatioX96: string;
  tickCurrent: number;
  liquidity: string;
}

/**
 * Define the configuration schema for the Hedera DEX plugin with the following properties:
 *
 * @param {string} SAUCERSWAP_API_URL - The SaucerSwap API base URL (optional, defaults to mainnet)
 * @param {string} HEDERA_NETWORK - The Hedera network to use (mainnet, testnet, previewnet)
 * @returns {object} - The configured schema object
 */
const configSchema = z.object({
  HEDERA_MIRROR_NODE_URL: z
    .string()
    .url('Invalid Hedera Mirror Node URL')
    .optional()
    .default('https://mainnet.mirrornode.hedera.com'),
  HEDERA_NETWORK: z
    .enum(['mainnet', 'testnet', 'previewnet'])
    .optional()
    .default('mainnet')
    .transform((val) => {
      if (val === 'previewnet') {
        console.warn('Warning: Previewnet may have limited SaucerSwap contract data');
      }
      return val;
    }),
  DEMO_MODE: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
});

/**
 * Helper function to get the appropriate Hedera Mirror Node URL based on network
 */
function getHederaMirrorNodeUrl(network: string, baseUrl?: string): string {
  if (baseUrl && baseUrl !== 'https://mainnet.mirrornode.hedera.com') {
    return baseUrl; // Use custom URL if provided
  }

  switch (network) {
    case 'testnet':
      return 'https://testnet.mirrornode.hedera.com';
    case 'previewnet':
      return 'https://previewnet.mirrornode.hedera.com';
    case 'mainnet':
    default:
      return 'https://mainnet.mirrornode.hedera.com';
  }
}

/**
 * SaucerSwap V2 Factory contract addresses by network
 */
const SAUCERSWAP_V2_FACTORY_CONTRACTS = {
  mainnet: '0.0.3946833',
  testnet: '0.0.1197038',
  previewnet: null, // Not deployed on previewnet
};

/**
 * Helper function to convert hex string to decimal
 */
function hexToDecimal(hex: string): string {
  return BigInt(hex).toString();
}

/**
 * Helper function to convert Hedera entity ID from hex to dot notation
 */
function hexToHederaId(hex: string): string {
  const decimal = parseInt(hex, 16);
  return `0.0.${decimal}`;
}

/**
 * Fetch token information from Hedera Mirror Node
 */
async function fetchTokenInfo(tokenId: string, mirrorNodeUrl: string): Promise<ApiToken | null> {
  try {
    const response = await axios.get(`${mirrorNodeUrl}/api/v1/tokens/${tokenId}`);
    const token = response.data;

    return {
      decimals: parseInt(token.decimals),
      id: token.token_id,
      name: token.name || token.symbol,
      price: '0', // Price would need to be fetched from a price oracle
      priceUsd: 0,
      symbol: token.symbol,
      dueDiligenceComplete: true,
      isFeeOnTransferToken: false,
      timestampSecondsLastListingChange: Math.floor(new Date(token.created_timestamp * 1000).getTime() / 1000),
      description: token.memo || `${token.name} token on Hedera`,
      website: null,
      twitterHandle: null,
      sentinelReport: null,
      icon: undefined
    };
  } catch (error) {
    logger.error(`Failed to fetch token info for ${tokenId}:`, error);
    return null;
  }
}

/**
 * Parse pool creation events from contract logs
 */
async function parsePoolCreationEvents(logs: any[], mirrorNodeUrl: string): Promise<ApiLiquidityPoolV2[]> {
  const pools: ApiLiquidityPoolV2[] = [];
  const POOL_CREATED_TOPIC = '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118';

  for (const log of logs) {
    if (log.topics && log.topics[0] === POOL_CREATED_TOPIC && log.topics.length >= 4) {
      try {
        // Parse the event data
        const token0Id = hexToHederaId(log.topics[1]);
        const token1Id = hexToHederaId(log.topics[2]);
        const fee = parseInt(log.topics[3], 16);

        // Extract pool address from data
        const poolAddress = log.data.slice(66, 106); // Skip first 32 bytes, get next 20 bytes
        const poolId = hexToHederaId('0x' + poolAddress);

        // Fetch token information
        const [tokenA, tokenB] = await Promise.all([
          fetchTokenInfo(token0Id, mirrorNodeUrl),
          fetchTokenInfo(token1Id, mirrorNodeUrl)
        ]);

        if (tokenA && tokenB) {
          pools.push({
            id: pools.length + 1,
            contractId: poolId,
            tokenA,
            amountA: '0', // Would need to query pool contract for current amounts
            tokenB,
            amountB: '0',
            fee,
            sqrtRatioX96: '79228162514264337593543950336', // Default value
            tickCurrent: 0,
            liquidity: '0'
          });
        }
      } catch (error) {
        logger.error('Error parsing pool creation event:', error);
      }
    }
  }

  return pools;
}

/**
 * Mock data for demo mode
 */
const mockPoolsData: ApiLiquidityPoolV2[] = [
  {
    id: 1,
    contractId: '0.0.123456',
    tokenA: {
      decimals: 8,
      id: '0.0.456789',
      name: 'Hedera Hashgraph',
      price: '100000000',
      priceUsd: 0.05,
      symbol: 'HBAR',
      dueDiligenceComplete: true,
      isFeeOnTransferToken: false,
      timestampSecondsLastListingChange: 1640995200,
      description: 'Native token of Hedera network',
      website: 'https://hedera.com',
      twitterHandle: 'hedera',
      sentinelReport: null,
      icon: '/images/tokens/hbar.svg'
    },
    amountA: '1000000000000',
    tokenB: {
      decimals: 6,
      id: '0.0.731861',
      name: 'SaucerSwap',
      price: '36806544',
      priceUsd: 0.01760954,
      symbol: 'SAUCE',
      dueDiligenceComplete: true,
      isFeeOnTransferToken: false,
      timestampSecondsLastListingChange: 1640995200,
      description: 'SaucerSwap governance token',
      website: 'https://saucerswap.finance',
      twitterHandle: 'SaucerSwapLabs',
      sentinelReport: null,
      icon: '/images/tokens/sauce.svg'
    },
    amountB: '500000000000',
    fee: 3000,
    sqrtRatioX96: '79228162514264337593543950336',
    tickCurrent: 0,
    liquidity: '1000000000000000000'
  }
];

/**
 * Fetch All Pools Action
 * Retrieves all V2 liquidity pools from SaucerSwap
 */
const fetchAllPoolsAction: Action = {
  name: 'FETCH_ALL_POOLS',
  similes: ['GET_POOLS', 'LIST_POOLS', 'SHOW_POOLS', 'SAUCERSWAP_POOLS'],
  description: 'Fetches all liquidity pools from SaucerSwap V2 with detailed information including tokens, liquidity, and fees',

  validate: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<boolean> => {
    // Always valid - no specific validation needed for fetching pools
    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ): Promise<ActionResult> => {
    try {
      logger.info('Handling FETCH_ALL_POOLS action');

      // Get configuration
      const network = runtime.getSetting('HEDERA_NETWORK') || 'mainnet';
      const mirrorNodeUrl = runtime.getSetting('HEDERA_MIRROR_NODE_URL');
      const demoMode = runtime.getSetting('DEMO_MODE') === 'true';

      let pools: ApiLiquidityPoolV2[];
      let dataSource: string;

      if (demoMode) {
        // Use mock data in demo mode
        logger.info('Using demo mode with mock data');
        pools = mockPoolsData;
        dataSource = 'Demo Mode (Mock Data)';
      } else {
        // Use Hedera Mirror Node API to fetch contract data
        const hederaApiUrl = getHederaMirrorNodeUrl(network, mirrorNodeUrl);
        const factoryContract = SAUCERSWAP_V2_FACTORY_CONTRACTS[network as keyof typeof SAUCERSWAP_V2_FACTORY_CONTRACTS];

        if (!factoryContract) {
          logger.warn(`SaucerSwap V2 Factory not available on ${network}, using demo data`);
          pools = mockPoolsData;
          dataSource = `Demo Mode (${network} not supported)`;
        } else {
          logger.info(`Fetching pool creation events from: ${hederaApiUrl}/api/v1/contracts/${factoryContract}/results/logs`);

          try {
            // Fetch pool creation events from the factory contract
            const logsResponse = await axios.get(`${hederaApiUrl}/api/v1/contracts/${factoryContract}/results/logs?limit=20`);
            const logs = logsResponse.data.logs || [];

            logger.info(`Found ${logs.length} contract events`);

            // Parse pool creation events to get real pool data
            pools = await parsePoolCreationEvents(logs, hederaApiUrl);

            if (pools.length === 0) {
              logger.warn('No pools found in contract events, using mock data');
              pools = mockPoolsData;
              dataSource = `Hedera Mirror Node (${hederaApiUrl}) - No pools found, using mock data`;
            } else {
              dataSource = `Hedera Mirror Node (${hederaApiUrl}) - ${pools.length} pools from contract events`;
            }

            logger.info(`Successfully parsed ${pools.length} pools from SaucerSwap V2 Factory contract: ${factoryContract}`);
          } catch (error) {
            logger.error('Error fetching pool data from Hedera Mirror Node:', error);
            pools = mockPoolsData;
            dataSource = `Hedera Mirror Node (${hederaApiUrl}) - Error fetching data, using mock data`;
          }
        }
      }

      logger.info(`Successfully fetched ${pools.length} pools`);

      // Format the response
      let poolsText = `Found ${pools.length} liquidity pools on SaucerSwap V2:\n\n`;

      pools.slice(0, 10).forEach((pool, index) => {
        const symbolA = pool.tokenA.symbol;
        const symbolB = pool.tokenB.symbol;
        const feeTier = (pool.fee / 10_000.0).toFixed(2);
        const liquidityFormatted = parseFloat(pool.liquidity).toLocaleString();

        poolsText += `${index + 1}. ${symbolA}/${symbolB}\n`;
        poolsText += `   • Fee Tier: ${feeTier}%\n`;
        poolsText += `   • Pool ID: ${pool.id}\n`;
        poolsText += `   • Contract ID: ${pool.contractId}\n`;
        poolsText += `   • Current Tick: ${pool.tickCurrent}\n`;
        poolsText += `   • Liquidity: ${liquidityFormatted}\n`;
        poolsText += `   • Token A: ${pool.tokenA.name} (${pool.tokenA.symbol})\n`;
        poolsText += `   • Token B: ${pool.tokenB.name} (${pool.tokenB.symbol})\n\n`;
      });

      if (pools.length > 10) {
        poolsText += `... and ${pools.length - 10} more pools.\n`;
      }

      poolsText += `\nData source: ${dataSource}`;

      // Response content
      const responseContent: Content = {
        text: poolsText,
        actions: ['FETCH_ALL_POOLS'],
        source: message.content.source,
      };

      // Call back with the pools information
      await callback(responseContent);

      return {
        text: `Successfully fetched ${pools.length} pools from SaucerSwap`,
        values: {
          success: true,
          poolCount: pools.length,
          network: network,
          demoMode: demoMode,
        },
        data: {
          actionName: 'FETCH_ALL_POOLS',
          messageId: message.id,
          timestamp: Date.now(),
          pools: pools.slice(0, 10), // Return first 10 pools in data
          totalPools: pools.length,
          dataSource: dataSource,
        },
        success: true,
      };
    } catch (error) {
      logger.error('Error in FETCH_ALL_POOLS action:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        text: `Failed to fetch pools from SaucerSwap: ${errorMessage}`,
        values: {
          success: false,
          error: 'FETCH_POOLS_FAILED',
        },
        data: {
          actionName: 'FETCH_ALL_POOLS',
          error: errorMessage,
          timestamp: Date.now(),
        },
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: '{{name1}}',
        content: {
          text: 'Show me all the liquidity pools on SaucerSwap',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Here are the available liquidity pools on SaucerSwap V2...',
          actions: ['FETCH_ALL_POOLS'],
        },
      },
    ],
    [
      {
        name: '{{name1}}',
        content: {
          text: 'What pools are available for trading?',
        },
      },
      {
        name: '{{name2}}',
        content: {
          text: 'Let me fetch the current liquidity pools from SaucerSwap...',
          actions: ['FETCH_ALL_POOLS'],
        },
      },
    ],
  ],
};

/**
 * Hedera DEX Provider
 * Provides context about SaucerSwap and Hedera DEX capabilities
 */
const hederaDexProvider: Provider = {
  name: 'HEDERA_DEX_PROVIDER',
  description: 'Provides information about Hedera DEX capabilities and SaucerSwap integration',

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    const network = runtime.getSetting('HEDERA_NETWORK') || 'mainnet';
    const apiUrl = runtime.getSetting('SAUCERSWAP_API_URL') || 'https://api.saucerswap.finance';

    return {
      text: `Hedera DEX integration active on ${network} network using SaucerSwap API at ${apiUrl}`,
      values: {
        network,
        apiUrl,
        capabilities: ['fetch_pools', 'pool_information', 'liquidity_data'],
      },
      data: {
        supportedNetworks: ['mainnet', 'testnet'],
        apiEndpoints: {
          mainnet: 'https://api.saucerswap.finance',
          testnet: 'https://test-api.saucerswap.finance',
        },
      },
    };
  },
};

export class HederaDexService extends Service {
  static serviceType = 'hedera-dex';
  capabilityDescription =
    'This is a Hedera DEX service which provides integration with SaucerSwap and other Hedera-based DEX protocols.';

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info('*** Starting Hedera DEX service ***');
    const service = new HederaDexService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info('*** Stopping Hedera DEX service ***');
    // get the service from the runtime
    const service = runtime.getService(HederaDexService.serviceType);
    if (!service) {
      throw new Error('Hedera DEX service not found');
    }
    service.stop();
  }

  async stop() {
    logger.info('*** Stopping Hedera DEX service instance ***');
  }
}

const plugin: Plugin = {
  name: 'hedera-dex',
  description: 'A Hedera DEX plugin for interacting with SaucerSwap',
  priority: 100,
  config: {
    HEDERA_MIRROR_NODE_URL: process.env.HEDERA_MIRROR_NODE_URL,
    HEDERA_NETWORK: process.env.HEDERA_NETWORK,
    DEMO_MODE: process.env.DEMO_MODE,
  },
  async init(config: Record<string, string>) {
    logger.info('*** Initializing Hedera DEX plugin ***');
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set environment variables (excluding boolean values)
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value !== undefined && typeof value === 'string') {
          process.env[key] = value;
        } else if (key === 'DEMO_MODE' && typeof value === 'boolean') {
          process.env[key] = value.toString();
        }
      }

      logger.info(`Hedera DEX plugin initialized for network: ${validatedConfig.HEDERA_NETWORK}`);
      logger.info(`Using Hedera Mirror Node: ${validatedConfig.HEDERA_MIRROR_NODE_URL}`);
      logger.info(`Demo mode: ${validatedConfig.DEMO_MODE ? 'enabled' : 'disabled'}`);

      const factoryContract = SAUCERSWAP_V2_FACTORY_CONTRACTS[validatedConfig.HEDERA_NETWORK as keyof typeof SAUCERSWAP_V2_FACTORY_CONTRACTS];
      if (factoryContract) {
        logger.info(`SaucerSwap V2 Factory contract: ${factoryContract}`);
      } else {
        logger.warn(`SaucerSwap V2 Factory not available on ${validatedConfig.HEDERA_NETWORK}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid Hedera DEX plugin configuration: ${error.errors.map((e) => e.message).join(', ')}`
        );
      }
      throw error;
    }
  },
  models: {
    [ModelType.TEXT_SMALL]: async (
      _runtime,
      { prompt, stopSequences = [] }: GenerateTextParams
    ) => {
      return 'Never gonna give you up, never gonna let you down, never gonna run around and desert you...';
    },
    [ModelType.TEXT_LARGE]: async (
      _runtime,
      {
        prompt,
        stopSequences = [],
        maxTokens = 8192,
        temperature = 0.7,
        frequencyPenalty = 0.7,
        presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      return 'Never gonna make you cry, never gonna say goodbye, never gonna tell a lie and hurt you...';
    },
  },
  routes: [
    {
      name: 'pools',
      path: '/pools',
      type: 'GET',
      handler: async (_req: any, res: any) => {
        try {
          const network = process.env.HEDERA_NETWORK || 'mainnet';
          const mirrorNodeUrl = process.env.HEDERA_MIRROR_NODE_URL;
          const demoMode = process.env.DEMO_MODE === 'true';
          const factoryContract = SAUCERSWAP_V2_FACTORY_CONTRACTS[network as keyof typeof SAUCERSWAP_V2_FACTORY_CONTRACTS];

          let pools: ApiLiquidityPoolV2[];
          let dataSource: string;

          if (demoMode) {
            // Use mock data in demo mode
            pools = mockPoolsData;
            dataSource = 'Demo Mode (Mock Data)';
          } else {
            // Use Hedera Mirror Node API
            const hederaApiUrl = getHederaMirrorNodeUrl(network, mirrorNodeUrl);

            if (!factoryContract) {
              pools = mockPoolsData;
              dataSource = `Demo Mode (${network} not supported)`;
            } else {
              try {
                // Fetch pool creation events from the factory contract
                const logsResponse = await axios.get(`${hederaApiUrl}/api/v1/contracts/${factoryContract}/results/logs?limit=20`);
                const logs = logsResponse.data.logs || [];

                // Parse pool creation events to get real pool data
                pools = await parsePoolCreationEvents(logs, hederaApiUrl);

                if (pools.length === 0) {
                  pools = mockPoolsData;
                  dataSource = `Hedera Mirror Node (${hederaApiUrl}) - No pools found, using mock data`;
                } else {
                  dataSource = `Hedera Mirror Node (${hederaApiUrl}) - ${pools.length} pools from contract events`;
                }
              } catch (error) {
                pools = mockPoolsData;
                dataSource = `Hedera Mirror Node (${hederaApiUrl}) - Error fetching data, using mock data`;
              }
            }
          }

          res.json({
            success: true,
            network,
            demoMode: demoMode || !factoryContract,
            totalPools: pools.length,
            pools: pools.slice(0, 20), // Return first 20 pools
            dataSource,
            mirrorNodeUrl: getHederaMirrorNodeUrl(network, mirrorNodeUrl),
            factoryContract,
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    },
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('MESSAGE_RECEIVED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        logger.info('VOICE_MESSAGE_RECEIVED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    WORLD_CONNECTED: [
      async (params) => {
        logger.info('WORLD_CONNECTED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
    WORLD_JOINED: [
      async (params) => {
        logger.info('WORLD_JOINED event received');
        // print the keys
        logger.info(Object.keys(params));
      },
    ],
  },
  services: [HederaDexService],
  actions: [fetchAllPoolsAction],
  providers: [hederaDexProvider],
};

export default plugin;
