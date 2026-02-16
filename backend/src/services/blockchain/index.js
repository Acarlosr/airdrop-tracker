import axios from 'axios';
import { ethers } from 'ethers';
import logger from '../utils/logger.js';
import { cacheGet, cacheSet } from '../config/redis.js';

// Moralis client (40k requests/month free)
const moralisClient = axios.create({
  baseURL: 'https://deep-index.moralis.io/api/v2.2',
  headers: {
    'X-API-Key': process.env.MORALIS_API_KEY
  },
  timeout: 10000
});

// Public RPC providers (free)
const rpcProviders = {
  ethereum: new ethers.JsonRpcProvider(process.env.ETH_RPC_URL || 'https://ethereum.publicnode.com'),
  arbitrum: new ethers.JsonRpcProvider(process.env.ARB_RPC_URL || 'https://arbitrum.publicnode.com'),
  optimism: new ethers.JsonRpcProvider(process.env.OP_RPC_URL || 'https://optimism.publicnode.com'),
  base: new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://base.publicnode.com'),
  polygon: new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || 'https://polygon.publicnode.com')
};

// Etherscan clients (5 calls/sec free)
const etherscanAPIs = {
  ethereum: 'https://api.etherscan.io/api',
  arbitrum: 'https://api.arbiscan.io/api',
  optimism: 'https://api-optimistic.etherscan.io/api',
  base: 'https://api.basescan.org/api',
  polygon: 'https://api.polygonscan.com/api'
};

class BlockchainService {
  
  /**
   * Get wallet transaction history using Moralis
   */
  async getWalletTransactions(address, chain = 'ethereum') {
    const cacheKey = `tx:${chain}:${address}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
    
    try {
      const chainMapping = {
        ethereum: '0x1',
        arbitrum: '0xa4b1',
        optimism: '0xa',
        base: '0x2105',
        polygon: '0x89'
      };
      
      const response = await moralisClient.get(`/${address}`, {
        params: {
          chain: chainMapping[chain] || chain
        }
      });
      
      const transactions = response.data.result || [];
      
      // Cache for 1 hour
      await cacheSet(cacheKey, transactions, 3600);
      
      logger.info(`Fetched ${transactions.length} transactions for ${address} on ${chain}`);
      return transactions;
      
    } catch (err) {
      logger.error(`Moralis transaction fetch error: ${err.message}`);
      
      // Fallback to Etherscan if Moralis fails
      return await this.getTransactionsFromEtherscan(address, chain);
    }
  }
  
  /**
   * Fallback: Get transactions from Etherscan API
   */
  async getTransactionsFromEtherscan(address, chain) {
    const apiUrl = etherscanAPIs[chain];
    if (!apiUrl) {
      logger.warn(`No Etherscan API for chain: ${chain}`);
      return [];
    }
    
    const apiKey = process.env[`${chain.toUpperCase()}_ETHERSCAN_API_KEY`] || process.env.ETHERSCAN_API_KEY;
    
    try {
      const response = await axios.get(apiUrl, {
        params: {
          module: 'account',
          action: 'txlist',
          address,
          startblock: 0,
          endblock: 99999999,
          sort: 'desc',
          apikey: apiKey
        }
      });
      
      return response.data.result || [];
    } catch (err) {
      logger.error(`Etherscan fetch error: ${err.message}`);
      return [];
    }
  }
  
  /**
   * Get wallet balance across multiple chains
   */
  async getWalletBalances(address) {
    const cacheKey = `balance:${address}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
    
    const balances = {};
    
    for (const [chain, provider] of Object.entries(rpcProviders)) {
      try {
        const balance = await provider.getBalance(address);
        balances[chain] = {
          native: ethers.formatEther(balance),
          usd: null // Would need price API integration
        };
      } catch (err) {
        logger.error(`Failed to get balance on ${chain}: ${err.message}`);
        balances[chain] = { native: '0', usd: null };
      }
    }
    
    // Cache for 5 minutes
    await cacheSet(cacheKey, balances, 300);
    
    return balances;
  }
  
  /**
   * Get DeFi positions using Moralis
   */
  async getDefiPositions(address, chain = 'ethereum') {
    const cacheKey = `defi:${chain}:${address}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
    
    try {
      const chainMapping = {
        ethereum: '0x1',
        arbitrum: '0xa4b1',
        optimism: '0xa',
        base: '0x2105',
        polygon: '0x89'
      };
      
      const response = await moralisClient.get(`/wallets/${address}/defi/positions`, {
        params: {
          chain: chainMapping[chain] || chain
        }
      });
      
      const positions = response.data || [];
      
      // Cache for 1 hour
      await cacheSet(cacheKey, positions, 3600);
      
      return positions;
      
    } catch (err) {
      logger.error(`Moralis DeFi positions error: ${err.message}`);
      return [];
    }
  }
  
  /**
   * Get NFT holdings
   */
  async getNFTs(address, chain = 'ethereum') {
    const cacheKey = `nft:${chain}:${address}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
    
    try {
      const chainMapping = {
        ethereum: '0x1',
        arbitrum: '0xa4b1',
        optimism: '0xa',
        base: '0x2105',
        polygon: '0x89'
      };
      
      const response = await moralisClient.get(`/${address}/nft`, {
        params: {
          chain: chainMapping[chain] || chain,
          format: 'decimal'
        }
      });
      
      const nfts = response.data.result || [];
      
      // Cache for 6 hours
      await cacheSet(cacheKey, nfts, 21600);
      
      return nfts;
      
    } catch (err) {
      logger.error(`Moralis NFT fetch error: ${err.message}`);
      return [];
    }
  }
  
  /**
   * Check if wallet interacted with specific protocol
   */
  async hasInteractedWithProtocol(address, protocolAddress, chain = 'ethereum') {
    const transactions = await this.getWalletTransactions(address, chain);
    
    return transactions.some(tx => 
      tx.to?.toLowerCase() === protocolAddress.toLowerCase() ||
      tx.from?.toLowerCase() === protocolAddress.toLowerCase()
    );
  }
  
  /**
   * Calculate wallet activity score
   */
  async calculateActivityScore(address, chain = 'ethereum') {
    const transactions = await this.getWalletTransactions(address, chain);
    
    const score = {
      totalTx: transactions.length,
      uniqueDays: new Set(transactions.map(tx => 
        new Date(tx.block_timestamp * 1000).toDateString()
      )).size,
      totalVolume: transactions.reduce((sum, tx) => 
        sum + parseFloat(ethers.formatEther(tx.value || '0')), 0
      ),
      firstTx: transactions.length > 0 ? 
        new Date(transactions[transactions.length - 1].block_timestamp * 1000) : null,
      lastTx: transactions.length > 0 ? 
        new Date(transactions[0].block_timestamp * 1000) : null
    };
    
    // Simple scoring algorithm
    score.activityScore = Math.min(
      (score.totalTx / 10) * 20 + // Max 20 points for transactions
      (score.uniqueDays / 30) * 30 + // Max 30 points for active days
      (score.totalVolume > 1 ? 50 : score.totalVolume * 50), // Max 50 points for volume
      100
    );
    
    return score;
  }
  
  /**
   * Check eligibility based on common airdrop criteria
   */
  async checkEligibility(address, criteria, chain = 'ethereum') {
    const results = {
      eligible: true,
      score: 0,
      criteriaM et: {},
      reasons: []
    };
    
    // Get wallet data
    const transactions = await this.getWalletTransactions(address, chain);
    const activityScore = await this.calculateActivityScore(address, chain);
    
    // Check minimum transactions
    if (criteria.minTx) {
      const met = transactions.length >= criteria.minTx;
      results.criteriaMet.minTx = met;
      if (met) {
        results.score += 20;
        results.reasons.push(`✅ Has ${transactions.length} transactions (min: ${criteria.minTx})`);
      } else {
        results.eligible = false;
        results.reasons.push(`❌ Only ${transactions.length} transactions (need: ${criteria.minTx})`);
      }
    }
    
    // Check minimum volume
    if (criteria.minVolume) {
      const met = activityScore.totalVolume >= criteria.minVolume;
      results.criteriaMet.minVolume = met;
      if (met) {
        results.score += 30;
        results.reasons.push(`✅ Total volume: ${activityScore.totalVolume.toFixed(2)} ETH`);
      } else {
        results.eligible = false;
        results.reasons.push(`❌ Volume too low: ${activityScore.totalVolume.toFixed(2)} ETH (need: ${criteria.minVolume})`);
      }
    }
    
    // Check protocol interaction
    if (criteria.protocolAddress) {
      const met = await this.hasInteractedWithProtocol(address, criteria.protocolAddress, chain);
      results.criteriaMet.protocolInteraction = met;
      if (met) {
        results.score += 50;
        results.reasons.push(`✅ Interacted with protocol`);
      } else {
        results.eligible = false;
        results.reasons.push(`❌ No interaction with protocol`);
      }
    }
    
    // Check NFT holdings
    if (criteria.requireNFT) {
      const nfts = await this.getNFTs(address, chain);
      const met = nfts.length > 0;
      results.criteriaMet.nftHoldings = met;
      if (met) {
        results.score += 20;
        results.reasons.push(`✅ Holds ${nfts.length} NFTs`);
      }
    }
    
    return results;
  }
}

export default new BlockchainService();
