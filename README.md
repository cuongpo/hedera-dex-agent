# Hedera DEX Agent 🌊

A specialized AI agent for interacting with Hedera Hashgraph and SaucerSwap DEX operations. Execute real token swaps, analyze pools, and manage DeFi operations through natural language commands.

## 🚀 Features

### **Real Token Swapping**
- **Execute Real Swaps**: Perform actual token swaps on Hedera testnet/mainnet
- **SaucerSwap V2 Integration**: Direct integration with official SaucerSwap router
- **Multi-Network Support**: Works on both testnet (safe testing) and mainnet
- **Transaction Tracking**: Full HashScan integration with transaction links

### **Pool Discovery & Analysis**
- **Live Pool Data**: Fetch real-time SaucerSwap V2 pool information
- **16+ Active Pools**: Discover WHBAR/TIOT, WHBAR/SAUCE, USDC/HCHF, and more
- **Liquidity Metrics**: Pool liquidity status and fee tier information
- **Token Metadata**: Complete token details with names, symbols, and decimals

### **Hedera Blockchain Integration**
- **Native HBAR Operations**: Balance checking, transfers, and account management
- **HCS & HTS Support**: Hedera Consensus Service and Token Service operations
- **Smart Contract Interaction**: Deploy and interact with Hedera smart contracts
- **Account Management**: Comprehensive account information and operations

### **Multi-Platform Support**
- **Telegram Bot**: Integrated Telegram bot for mobile/desktop access
- **Web Interface**: Direct web-based interaction
- **API Access**: RESTful API for custom integrations

## 🎯 Usage Examples

### **Token Swapping**
```
"Swap 1 HBAR for USDT"
"Trade 0.5 WHBAR for SAUCE"
"Exchange 100 USDC to HBAR"
```

### **Pool Information**
```
"List all available pools"
"Show pool info for WHBAR and USDC"
"What pools are available for trading?"
```

### **Account Operations**
```
"Check my HBAR balance"
"Show my token balances"
"Transfer 10 HBAR to 0.0.123456"
```

## 🛠️ Quick Start

### **1. Clone & Install**
```bash
git clone <repository-url>
cd hedera-dex-agent
npm install
```

### **2. Configure Environment**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Network Configuration
HEDERA_NETWORK=testnet
HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

# Wallet Configuration (for real swaps)
HEDERA_PRIVATE_KEY=your_private_key_here
HEDERA_ACCOUNT_ID=0.0.your_account_id

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### **3. Build & Run**
```bash
npm run build
npm run dev
```

## 🔧 Configuration Options

### **Network Settings**
- **Testnet**: Safe testing environment with fauceted HBAR
- **Mainnet**: Production environment for real trading

### **Wallet Integration**
- **Private Key**: For executing real transactions
- **Account ID**: Your Hedera account identifier
- **Auto-Detection**: Automatic account discovery from private key

### **Telegram Bot Setup**
1. Create bot with [@BotFather](https://t.me/botfather)
2. Get bot token
3. Add `TELEGRAM_BOT_TOKEN` to `.env`
4. Start chatting with your bot!

## 🌊 Available Testnet Pools

The agent has access to **16+ active testnet pools**:

| Pool | Fee Tier | Liquidity |
|------|----------|-----------|
| WHBAR/TIOT prod | 0.30% | Available ✅ |
| WHBAR/SAUCE | 0.30% | Available ✅ |
| USDC/HCHF | 0.05% | Available ✅ |
| USDC/DAI | 0.05% | Available ✅ |
| WHBAR/HBARX | 0.30% | Available ✅ |
| CLXY/WHBAR | 0.30% | Available ✅ |
| ... and 10+ more | Various | Available ✅ |

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │───▶│   Eliza Agent    │───▶│  Hedera Plugin  │
│ (Chat/Telegram) │    │   (Core AI)      │    │  (DEX Actions)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Response Gen.   │    │ SaucerSwap V2   │
                       │  (Formatted)     │    │   (Router)      │
                       └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   User Output    │    │ Hedera Network  │
                       │ (Chat/Telegram)  │    │  (Blockchain)   │
                       └──────────────────┘    └─────────────────┘
```

## 🧪 Testing

### **Testnet Testing** (Recommended)
```bash
# Get testnet HBAR from faucet
# Visit: https://portal.hedera.com/faucet

# Test swap commands
"Swap 0.1 HBAR for USDT"
"List all available pools"
```

### **Development Testing**
```bash
npm test                    # Run test suite
npm run test:pools         # Test pool discovery
npm run test:swaps         # Test swap functionality
```

## 🔗 Useful Links

- **HashScan Testnet**: https://hashscan.io/testnet
- **HashScan Mainnet**: https://hashscan.io/mainnet
- **SaucerSwap App**: https://app.saucerswap.finance
- **Hedera Docs**: https://docs.hedera.com
- **SaucerSwap Docs**: https://docs.saucerswap.finance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Telegram**: Contact via the integrated bot

---

**Built with ❤️ for the Hedera ecosystem** 🌊
