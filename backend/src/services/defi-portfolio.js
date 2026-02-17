import axios from 'axios';
import { getRedis } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * DeFi Portfolio Service
 * Integração com DeBank API para rastreamento de posições
 */

const DEBANK_API = 'https://api.debank.com/v1';
const CACHE_DURATION = 300; // 5 minutos

export class DefiPortfolioService {
  constructor() {
    this.client = axios.create({
      baseURL: DEBANK_API,
      timeout: 10000
    });
  }

  /**
   * Obter posições DeFi de uma wallet via DeBank
   */
  async getWalletPositions(walletAddress) {
    const redis = getRedis();
    const cacheKey = `debank:positions:${walletAddress.toLowerCase()}`;

    // Verificar cache
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug(`DeBank cache HIT: ${walletAddress}`);
        return JSON.parse(cached);
      }
    }

    try {
      logger.info(`Fetching DeBank positions for ${walletAddress}`);

      const response = await this.client.get('/user/all_token_list', {
        params: {
          id: walletAddress.toLowerCase(),
          chain_id: 'all'
        }
      });

      const positions = this.parsePositions(response.data);

      // Cache
      if (redis) {
        await redis.setEx(cacheKey, CACHE_DURATION, JSON.stringify(positions));
      }

      return positions;
    } catch (error) {
      logger.warn(`DeBank API error: ${error.message}`);
      return { tokens: [], protocols: [] };
    }
  }

  /**
   * Obter posições de lending/borrowing
   */
  async getLendingPositions(walletAddress) {
    const redis = getRedis();
    const cacheKey = `debank:lending:${walletAddress.toLowerCase()}`;

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      logger.info(`Fetching lending positions for ${walletAddress}`);

      const response = await this.client.get('/user/lending_protocols', {
        params: {
          id: walletAddress.toLowerCase(),
          chain_id: 'all'
        }
      });

      const lendingData = this.parseLendingData(response.data);

      if (redis) {
        await redis.setEx(cacheKey, CACHE_DURATION, JSON.stringify(lendingData));
      }

      return lendingData;
    } catch (error) {
      logger.warn(`DeBank lending API error: ${error.message}`);
      return { lending: [], borrowing: [] };
    }
  }

  /**
   * Obter posições LP (Liquidity Provider)
   */
  async getLPPositions(walletAddress) {
    const redis = getRedis();
    const cacheKey = `debank:lp:${walletAddress.toLowerCase()}`;

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    try {
      logger.info(`Fetching LP positions for ${walletAddress}`);

      const response = await this.client.get('/user/dex_liquidities', {
        params: {
          id: walletAddress.toLowerCase(),
          chain_id: 'all'
        }
      });

      const lpData = this.parseLPData(response.data);

      if (redis) {
        await redis.setEx(cacheKey, CACHE_DURATION, JSON.stringify(lpData));
      }

      return lpData;
    } catch (error) {
      logger.warn(`DeBank LP API error: ${error.message}`);
      return { liquidityPositions: [] };
    }
  }

  /**
   * Detectar tokens derivativos (stETH, aUSDC, PT-tokens, etc)
   */
  detectDerivativeTokens(positions) {
    const derivativePatterns = {
      staked: /^st[A-Z]/i, // stETH, stMatic
      aave: /^a[A-Z]/i, // aUSDC, aDAI
      pendle: /^PT-/i, // PT-USDC
      lido: /lido/i,
      curve: /^LP/i
    };

    return positions.filter(pos => {
      return Object.values(derivativePatterns).some(pattern => pattern.test(pos.symbol));
    });
  }

  /**
   * Detectar cadeias Money Lego automaticamente
   * Identifica tokens derivativos sendo usados em outros protocolos
   */
  async detectMoneyLegoChains(walletAddress) {
    try {
      const tokens = await this.getWalletPositions(walletAddress);
      const lending = await this.getLendingPositions(walletAddress);
      const lp = await this.getLPPositions(walletAddress);

      const derivatives = this.detectDerivativeTokens(tokens);
      const chains = [];

      // Verificar se derivativos estão sendo usados em outros protocolos
      derivatives.forEach(deriv => {
        const usedInLending = lending.lending.find(p => p.token === deriv.symbol);
        const usedInLP = lp.liquidityPositions.find(p => 
          p.token0 === deriv.symbol || p.token1 === deriv.symbol
        );

        if (usedInLending || usedInLP) {
          chains.push({
            sourceToken: deriv.symbol,
            sourceValue: deriv.balance_usd,
            sourceProtocol: this.identifyProtocol(deriv),
            usedIn: usedInLending ? 'lending' : 'liquidity',
            targetProtocol: usedInLending ? usedInLending.protocol_id : 'DEX',
            riskCascade: true
          });
        }
      });

      logger.info(`Detected ${chains.length} Money Lego chains for ${walletAddress}`);
      return chains;
    } catch (error) {
      logger.error('Error detecting Money Lego chains:', error);
      return [];
    }
  }

  /**
   * Calcular P&L do portfólio
   */
  calculatePortfolioMetrics(positions, lending) {
    let totalValue = 0;
    let totalDebt = 0;
    let positionCount = 0;

    // Somar valores
    positions.forEach(pos => {
      totalValue += parseFloat(pos.balance_usd || 0);
    });

    // Somar dívidas
    lending.borrowing.forEach(borrow => {
      totalDebt += parseFloat(borrow.balance_usd || 0);
    });

    positionCount = positions.length + lending.lending.length;

    return {
      totalValue,
      totalDebt,
      netValue: totalValue - totalDebt,
      positionCount,
      healthScore: this.calculateHealthScore(totalValue, totalDebt),
      portfolioComposition: this.analyzeComposition(positions, lending)
    };
  }

  /**
   * Calcular score de saúde do portfólio
   */
  calculateHealthScore(totalValue, totalDebt) {
    if (totalValue === 0) return 0;

    const leverageRatio = totalValue / (totalValue - totalDebt);

    // Score baseado em alavancagem
    if (leverageRatio < 1.2) return 95; // Conservador
    if (leverageRatio < 1.5) return 85; // Balanceado
    if (leverageRatio < 2.0) return 70; // Moderado
    if (leverageRatio < 3.0) return 50; // Alto risco
    return 20; // Muito arriscado
  }

  /**
   * Analisar composição do portfólio
   */
  analyzeComposition(positions, lending) {
    const composition = {};

    positions.forEach(pos => {
      const protocol = this.identifyProtocol(pos);
      composition[protocol] = (composition[protocol] || 0) + parseFloat(pos.balance_usd || 0);
    });

    return Object.entries(composition)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([protocol, value]) => ({
        protocol,
        value,
        percentage: ((value / positions.reduce((sum, p) => sum + parseFloat(p.balance_usd || 0), 0)) * 100).toFixed(2)
      }));
  }

  /**
   * Identificar protocolo pelo token
   */
  identifyProtocol(token) {
    if (token.symbol?.includes('st')) return 'Lido';
    if (token.symbol?.includes('a')) return 'Aave';
    if (token.symbol?.includes('PT-')) return 'Pendle';
    if (token.protocol_id) return token.protocol_id;
    return 'Unknown';
  }

  /**
   * Parser de dados DeBank
   */
  parsePositions(data) {
    if (!data.data) return { tokens: [], protocols: [] };

    return {
      tokens: data.data.map(token => ({
        symbol: token.name,
        balance: token.amount,
        balance_usd: token.amount_usd,
        protocol_id: token.protocol_id,
        chain: token.chain,
        imageUrl: token.logo_url
      })),
      protocols: [...new Set(data.data.map(t => t.protocol_id))]
    };
  }

  /**
   * Parser de dados de lending
   */
  parseLendingData(data) {
    return {
      lending: (data.data?.lend || []).map(l => ({
        protocol_id: l.protocol_id,
        token: l.token_id,
        balance_usd: l.amount_usd,
        apy: l.apy
      })),
      borrowing: (data.data?.borrow || []).map(b => ({
        protocol_id: b.protocol_id,
        token: b.token_id,
        balance_usd: b.amount_usd,
        apy: b.apy
      }))
    };
  }

  /**
   * Parser de dados LP
   */
  parseLPData(data) {
    return {
      liquidityPositions: (data.data || []).map(lp => ({
        protocol_id: lp.protocol_id,
        token0: lp.token0?.symbol,
        token1: lp.token1?.symbol,
        balance_usd: lp.amount_usd,
        apy: lp.apy,
        lpTokens: lp.lp_tokens
      }))
    };
  }
}

export default DefiPortfolioService;
