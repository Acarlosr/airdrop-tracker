import { query } from '../config/database.js';
import logger from '../utils/logger.js';

function normalizeAirdropRow(row) {
  if (!row) return row;
  const {
    tge_date,
    vesting_end_date,
    estimated_value,
    wallet_ids,
    wallet_status,
    ...rest
  } = row;

  return {
    ...rest,
    tgeDate: row.tgeDate ?? tge_date ?? null,
    vestingEndDate: row.vestingEndDate ?? vesting_end_date ?? null,
    estimatedValue: row.estimatedValue ?? estimated_value ?? null,
    walletIds: row.walletIds ?? wallet_ids ?? null,
    walletStatus: row.walletStatus ?? wallet_status ?? null,
  };
}

export default async function airdropRoutes(fastify, options) {
  
  // GET /api/airdrops - List all airdrops
  fastify.get('/', async (request, reply) => {
    const { status, chain, limit = 50, offset = 0 } = request.query;
    
    let sql = 'SELECT * FROM airdrops WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (chain) {
      sql += ` AND chain = $${paramIndex++}`;
      params.push(chain);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    try {
      const result = await query(sql, params);
      
      return {
        success: true,
        data: result.rows.map(normalizeAirdropRow),
        pagination: {
          limit,
          offset,
          total: result.rowCount
        }
      };
    } catch (err) {
      logger.error('Error fetching airdrops:', err);
      reply.code(500).send({ error: 'Failed to fetch airdrops' });
    }
  });
  
  // GET /api/airdrops/:id - Get single airdrop
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    
    try {
      const result = await query(
        'SELECT * FROM airdrops WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Airdrop not found' });
      }
      
      return {
        success: true,
        data: normalizeAirdropRow(result.rows[0])
      };
    } catch (err) {
      logger.error('Error fetching airdrop:', err);
      reply.code(500).send({ error: 'Failed to fetch airdrop' });
    }
  });
  
  // POST /api/airdrops - Create new airdrop (admin only)
  fastify.post('/', async (request, reply) => {
    const {
      id,
      name,
      protocol,
      chain,
      status = 'active',
      phase = null,
      total_supply,
      snapshot_date,
      claim_start,
      claim_end,
      tgeDate = null,
      vestingEndDate = null,
      estimatedValue = null,
      walletIds = null,
      walletStatus = null,
      criteria,
      links
    } = request.body;
    
    // Basic validation
    if (!id || !name) {
      return reply.code(400).send({ error: 'Missing required fields: id, name' });
    }
    
    try {
      const result = await query(
        `INSERT INTO airdrops 
        (id, name, protocol, chain, status, phase, total_supply, snapshot_date, claim_start, claim_end, tge_date, vesting_end_date, estimated_value, wallet_ids, wallet_status, criteria, links)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          id,
          name,
          protocol,
          chain,
          status,
          phase,
          total_supply,
          snapshot_date,
          claim_start,
          claim_end,
          tgeDate,
          vestingEndDate,
          estimatedValue,
          walletIds ? JSON.stringify(walletIds) : null,
          walletStatus ? JSON.stringify(walletStatus) : null,
          JSON.stringify(criteria),
          JSON.stringify(links),
        ]
      );
      
      logger.info(`New airdrop created: ${name}`);
      
      return {
        success: true,
        data: normalizeAirdropRow(result.rows[0])
      };
    } catch (err) {
      if (err.code === '23505') { // Unique violation
        return reply.code(409).send({ error: 'Airdrop already exists' });
      }
      logger.error('Error creating airdrop:', err);
      reply.code(500).send({ error: 'Failed to create airdrop' });
    }
  });
  
  // PATCH /api/airdrops/:id - Update airdrop
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params;
    const updates = request.body;
    
    const allowedFields = {
      status: 'status',
      snapshot_date: 'snapshot_date',
      claim_start: 'claim_start',
      claim_end: 'claim_end',
      criteria: 'criteria',
      links: 'links',
      phase: 'phase',
      tgeDate: 'tge_date',
      vestingEndDate: 'vesting_end_date',
      estimatedValue: 'estimated_value',
      walletIds: 'wallet_ids',
      walletStatus: 'wallet_status',
    };
    const updateFields = Object.keys(updates).filter((k) => allowedFields[k]);
    
    if (updateFields.length === 0) {
      return reply.code(400).send({ error: 'No valid fields to update' });
    }
    
    const setClause = updateFields.map((field, i) => `${allowedFields[field]} = $${i + 2}`).join(', ');
    const values = [id, ...updateFields.map((f) => {
      if (typeof updates[f] === 'object') return JSON.stringify(updates[f]);
      return updates[f];
    })];
    
    try {
      const result = await query(
        `UPDATE airdrops SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Airdrop not found' });
      }
      
      logger.info(`Airdrop updated: ${id}`);
      
      return {
        success: true,
        data: normalizeAirdropRow(result.rows[0])
      };
    } catch (err) {
      logger.error('Error updating airdrop:', err);
      reply.code(500).send({ error: 'Failed to update airdrop' });
    }
  });

  // DELETE /api/airdrops/:id - Remove airdrop
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const result = await query('DELETE FROM airdrops WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Airdrop not found' });
      }
      return { success: true, deleted: true };
    } catch (err) {
      logger.error({ err, id }, 'Error deleting airdrop');
      return reply.code(500).send({ error: 'Failed to delete airdrop' });
    }
  });
  
  // GET /api/airdrops/active/count - Get active airdrops count
  fastify.get('/active/count', async (request, reply) => {
    try {
      const result = await query(
        "SELECT COUNT(*) as count FROM airdrops WHERE status = 'active'"
      );
      
      return {
        success: true,
        count: parseInt(result.rows[0].count)
      };
    } catch (err) {
      logger.error('Error counting airdrops:', err);
      reply.code(500).send({ error: 'Failed to count airdrops' });
    }
  });
}
