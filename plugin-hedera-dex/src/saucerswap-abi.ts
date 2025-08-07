/**
 * SaucerSwap V2 Router ABI for swap operations
 * Based on official SaucerSwap documentation
 */

export const SAUCERSWAP_ROUTER_ABI = [
  // Swap functions
  {
    "inputs": [
      {
        "components": [
          { "internalType": "bytes", "name": "path", "type": "bytes" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" }
        ],
        "internalType": "struct ISwapRouter.ExactInputParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInput",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "internalType": "bytes", "name": "path", "type": "bytes" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
          { "internalType": "uint256", "name": "amountInMaximum", "type": "uint256" }
        ],
        "internalType": "struct ISwapRouter.ExactOutputParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactOutput",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  // Multicall function
  {
    "inputs": [
      { "internalType": "bytes[]", "name": "data", "type": "bytes[]" }
    ],
    "name": "multicall",
    "outputs": [
      { "internalType": "bytes[]", "name": "results", "type": "bytes[]" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  // Refund function
  {
    "inputs": [],
    "name": "refundETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// SaucerSwap contract addresses
export const SAUCERSWAP_CONTRACTS = {
  mainnet: {
    router: '0.0.3949434',
    factory: '0.0.3946833',
    whbar: '0.0.1456986', // Wrapped HBAR
  },
  testnet: {
    router: '0.0.3949434', // Use mainnet router for testing (SaucerSwap may not have testnet deployment)
    factory: '0.0.3946833',
    whbar: '0.0.1456986', // Use mainnet WHBAR for testing
  }
};

// Common token addresses (real mainnet addresses)
export const TOKEN_ADDRESSES = {
  mainnet: {
    HBAR: 'HBAR', // Native HBAR
    WHBAR: '0.0.1456986', // Wrapped HBAR
    USDC: '0.0.456858', // USDC on Hedera
    USDT: '0.0.1456986', // Using WHBAR as placeholder for USDT
    SAUCE: '0.0.731861', // SAUCE token
    BONZO: '0.0.1456986', // Using WHBAR as placeholder for BONZO
  },
  testnet: {
    HBAR: 'HBAR',
    WHBAR: '0.0.1456986', // Use mainnet WHBAR for testing
    USDC: '0.0.1456986',  // Use WHBAR as placeholder for testnet
    USDT: '0.0.1456986',  // Use WHBAR as placeholder for testnet
    SAUCE: '0.0.1456986', // Use WHBAR as placeholder for testnet
    BONZO: '0.0.1456986', // Use WHBAR as placeholder for testnet
  }
};

// Fee tiers (in basis points)
export const FEE_TIERS = {
  LOW: 500,    // 0.05%
  MEDIUM: 3000, // 0.30%
  HIGH: 10000,  // 1.00%
};

/**
 * Convert Hedera account ID to EVM address format
 */
export function hederaIdToEvmAddress(accountId: string): string {
  // Extract the account number from the Hedera ID (0.0.X)
  const parts = accountId.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid Hedera account ID format: ${accountId}`);
  }
  
  const accountNum = parseInt(parts[2]);
  if (isNaN(accountNum)) {
    throw new Error(`Invalid account number in Hedera ID: ${accountId}`);
  }
  
  // Convert to 20-byte EVM address (pad with zeros)
  const hex = accountNum.toString(16).padStart(40, '0');
  return '0x' + hex;
}

/**
 * Convert hex string to Uint8Array for Hedera SDK
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.replace('0x', '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Encode swap path for SaucerSwap router
 * Format: [token0, fee, token1, fee, token2, ...]
 */
export function encodeSwapPath(tokens: string[], fees: number[]): string {
  if (tokens.length !== fees.length + 1) {
    throw new Error('Invalid path: tokens length must be fees length + 1');
  }
  
  let path = '';
  for (let i = 0; i < tokens.length; i++) {
    // Add token address (20 bytes)
    const tokenAddress = hederaIdToEvmAddress(tokens[i]);
    path += tokenAddress.slice(2); // Remove 0x prefix
    
    // Add fee (3 bytes) if not the last token
    if (i < fees.length) {
      const feeHex = fees[i].toString(16).padStart(6, '0');
      path += feeHex;
    }
  }
  
  return '0x' + path;
}
