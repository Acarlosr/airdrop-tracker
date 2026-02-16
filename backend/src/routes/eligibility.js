import { query } from '../config/database.js';
import blockchainService from '../services/blockchain/index.js';
import { getCachedEligibility, cacheEligibility } from '../config/redis.js';
import logger from '../utils/logger.js';

export default async function eligibilityRoutes(fastify, options) {
  
  // POST /api/eligibility/check - Check wallet eligibility for airdrop
  fastify.post('/check', async (request, reply) => {
    const { wallet, airdropId, chain = 'ethereum', forceRefresh = false } = request.body;
    
    // Validation
    if (!wallet || !airdropId) {
      return reply.code(400).send({ 
        error: 'Missing required fields: wallet, airdropId' 
      });
    }
    
    // Normalize wallet address
    const walletAddress = wallet.toLowerCase();
    
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await getCachedEligibility(walletAddress, airdropId);
        if (cached) {
          logger.info(`Cache HIT for eligibility: ${walletAddress} - ${airdropId}`);
          return {
            success: true,
            data: cached,
            cached: true
          };
        }
      }
      
      // Get airdrop criteria
      const airdropResult = await query(
        'SELECT * FROM airdrops WHERE id = $1',
        [airdropId]
      );
      
      if (airdropResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Airdrop not found' });
      }
      
      const airdrop = airdropResult.rows[0];
      const criteria = airdrop.criteria || {};
      
      // Check eligibility using blockchain service
      const eligibilityResult = await blockchainService.checkEligibility(
        walletAddress,
        criteria,
        chain
      );
      
      // Store in database
      const dbResult = await query(
        `INSERT INTO eligibility_checks 
        (wallet_address, airdrop_id, is_eligible, score, criteria_met, allocation)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (wallet_address, airdrop_id) 
        DO UPDATE SET 
          is_eligible = $3,
          score = $4,
          criteria_met = $5,
          allocation = $6,
          checked_at = NOW()
        RETURNING *`,
        [
          walletAddress,
          airdropId,
          eligibilityResult.eligible,
          eligibilityResult.score,
          JSON.stringify(eligibilityResult.criteriaMet),
          eligibilityResult.allocation || 0
        ]
      );
      
      // Cache result for 7 days
      await cacheEligibility(walletAddress, airdropId, eligibilityResult);
      
      logger.info(`Eligibility checked: ${walletAddress} - ${airdropId} - ${eligibilityResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
      
      return {
        success: true,
        data: {
          ...eligibilityResult,
          airdrop: {
            id: airdrop.id,
            name: airdrop.name,
            chain: airdrop.chain
          }
        },
        cached: false
      };
      
    } catch (err) {
      logger.error('Error checking eligibility:', err);
      reply.code(500).send({ error: 'Failed to check eligibility' });
    }
  });
  
  // GET /api/eligibility/wallet/:address - Get all eligibility for wallet
  fastify.get('/wallet/:address', async (request, reply) => {
    const { address } = request.params;
    const walletAddress = address.toLowerCase();
    
    try {
      const result = await query(
        `SELECT 
          ec.*,
          a.name as airdrop_name,
          a.chain,
          a.status,
          a.claim_start,
          a.claim_end
        FROM eligibility_checks ec
        JOIN airdrops a ON ec.airdrop_id = a.id
        WHERE ec.wallet_address = $1
        ORDER BY ec.checked_at DESC`,
        [walletAddress]
      );
      
      return {
        success: true,
        data: result.rows,
        count: result.rowCount
      };
    } catch (err) {
      logger.error('Error fetching eligibility:', err);
      reply.code(500).send({ error: 'Failed to fetch eligibility' });
    }
  });
  
  // GET /api/eligibility/airdrop/:id - Get all eligible wallets for airdrop
  fastify.get('/airdrop/:id', async (request, reply) => {
    const { id } = request.params;
    const { eligible = true } = request.query;
    
    try {
      const result = await query(
        `SELECT * FROM eligibility_checks 
        WHERE airdrop_id = $1 AND is_eligible = $2
        ORDER BY score DESC`,
        [id, eligible]
      );
      
      return {
        success: true,
        data: result.rows,
        count: result.rowCount
      };
    } catch (err) {
      logger.error('Error fetching eligibility:', err);
      reply.code(500).send({ error: 'Failed to fetch eligibility' });
    }
  });
  
  // POST /api/eligibility/batch - Batch check multiple wallets
  fastify.post('/batch', async (request, reply) => {
    const { wallets, airdropId, chain = 'ethereum' } = request.body;
    
    if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
      return reply.code(400).send({ error: 'wallets must be a non-empty array' });
    }
    
    if (wallets.length > 20) {
      return reply.code(400).send({ error: 'Maximum 20 wallets per batch' });
    }
    
    try {
      const results = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const response = await fastify.inject({
              method: 'POST',
              url: '/api/eligibility/check',
              payload: { wallet, airdropId, chain }
            });
            return JSON.parse(response.payload);
          } catch (err) {
            return { wallet, error: err.message };
          }
        })
      );
      
      return {
        success: true,
        data: results
      };
    } catch (err) {
      logger.error('Error in batch eligibility check:', err);
      reply.code(500).send({ error: 'Failed to process batch check' });
    }
  });
}
