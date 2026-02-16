import { query } from '../config/database.js';
import blockchainService from '../services/blockchain/index.js';
import logger from '../utils/logger.js';

export default async function walletRoutes(fastify, options) {
  
  // GET /api/wallets - List all monitored wallets
  fastify.get('/', async (request, reply) => {
    try {
      const result = await query(
        'SELECT * FROM wallets ORDER BY created_at DESC'
      );
      
      return {
        success: true,
        data: result.rows,
        count: result.rowCount
      };
    } catch (err) {
      logger.error('Error fetching wallets:', err);
      reply.code(500).send({ error: 'Failed to fetch wallets' });
    }
  });
  
  // POST /api/wallets - Add new wallet to monitor
  fastify.post('/', async (request, reply) => {
    const { address, label, watchEnabled = true } = request.body;
    
    if (!address) {
      return reply.code(400).send({ error: 'Missing required field: address' });
    }
    
    const walletAddress = address.toLowerCase();
    
    try {
      const result = await query(
        `INSERT INTO wallets (address, label, watch_enabled)
        VALUES ($1, $2, $3)
        ON CONFLICT (address) 
        DO UPDATE SET label = $2, watch_enabled = $3
        RETURNING *`,
        [walletAddress, label, watchEnabled]
      );
      
      logger.info(`Wallet added: ${walletAddress}`);
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (err) {
      logger.error('Error adding wallet:', err);
      reply.code(500).send({ error: 'Failed to add wallet' });
    }
  });
  
  // GET /api/wallets/:address - Get wallet details
  fastify.get('/:address', async (request, reply) => {
    const { address } = request.params;
    const walletAddress = address.toLowerCase();
    
    try {
      const result = await query(
        'SELECT * FROM wallets WHERE address = $1',
        [walletAddress]
      );
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Wallet not found' });
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (err) {
      logger.error('Error fetching wallet:', err);
      reply.code(500).send({ error: 'Failed to fetch wallet' });
    }
  });
  
  // GET /api/wallets/:address/balances - Get wallet balances
  fastify.get('/:address/balances', async (request, reply) => {
    const { address } = request.params;
    
    try {
      const balances = await blockchainService.getWalletBalances(address);
      
      return {
        success: true,
        data: balances
      };
    } catch (err) {
      logger.error('Error fetching balances:', err);
      reply.code(500).send({ error: 'Failed to fetch balances' });
    }
  });
  
  // GET /api/wallets/:address/activity - Get wallet activity score
  fastify.get('/:address/activity', async (request, reply) => {
    const { address } = request.params;
    const { chain = 'ethereum' } = request.query;
    
    try {
      const activityScore = await blockchainService.calculateActivityScore(address, chain);
      
      return {
        success: true,
        data: activityScore
      };
    } catch (err) {
      logger.error('Error fetching activity:', err);
      reply.code(500).send({ error: 'Failed to fetch activity' });
    }
  });
  
  // DELETE /api/wallets/:address - Remove wallet from monitoring
  fastify.delete('/:address', async (request, reply) => {
    const { address } = request.params;
    const walletAddress = address.toLowerCase();
    
    try {
      const result = await query(
        'DELETE FROM wallets WHERE address = $1 RETURNING *',
        [walletAddress]
      );
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Wallet not found' });
      }
      
      logger.info(`Wallet removed: ${walletAddress}`);
      
      return {
        success: true,
        message: 'Wallet removed'
      };
    } catch (err) {
      logger.error('Error removing wallet:', err);
      reply.code(500).send({ error: 'Failed to remove wallet' });
    }
  });
  
  // PATCH /api/wallets/:address/toggle - Toggle wallet monitoring
  fastify.patch('/:address/toggle', async (request, reply) => {
    const { address } = request.params;
    const walletAddress = address.toLowerCase();
    
    try {
      const result = await query(
        `UPDATE wallets 
        SET watch_enabled = NOT watch_enabled 
        WHERE address = $1 
        RETURNING *`,
        [walletAddress]
      );
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Wallet not found' });
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (err) {
      logger.error('Error toggling wallet:', err);
      reply.code(500).send({ error: 'Failed to toggle wallet' });
    }
  });
}
