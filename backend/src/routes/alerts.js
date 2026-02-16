import { query } from '../config/database.js';
import logger from '../utils/logger.js';

export default async function alertsRoutes(fastify, options) {
  
  // GET /api/alerts - Get all alerts
  fastify.get('/', async (request, reply) => {
    const { priority, notified, limit = 50, offset = 0 } = request.query;
    
    let sql = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (priority) {
      sql += ` AND priority = $${paramIndex++}`;
      params.push(priority);
    }
    
    if (notified !== undefined) {
      sql += ` AND notified = $${paramIndex++}`;
      params.push(notified === 'true');
    }
    
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    try {
      const result = await query(sql, params);
      
      return {
        success: true,
        data: result.rows,
        pagination: {
          limit,
          offset,
          total: result.rowCount
        }
      };
    } catch (err) {
      logger.error('Error fetching alerts:', err);
      reply.code(500).send({ error: 'Failed to fetch alerts' });
    }
  });
  
  // POST /api/alerts - Create new alert
  fastify.post('/', async (request, reply) => {
    const {
      airdropId,
      priority = 'normal',
      title,
      message,
      source,
      sourceUrl,
      metadata
    } = request.body;
    
    if (!title || !message) {
      return reply.code(400).send({ error: 'Missing required fields: title, message' });
    }
    
    try {
      const result = await query(
        `INSERT INTO alerts 
        (airdrop_id, priority, title, message, source, source_url, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [airdropId, priority, title, message, source, sourceUrl, JSON.stringify(metadata)]
      );
      
      logger.info(`New alert created: ${title} (${priority})`);
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (err) {
      logger.error('Error creating alert:', err);
      reply.code(500).send({ error: 'Failed to create alert' });
    }
  });
  
  // PATCH /api/alerts/:id/notify - Mark alert as notified
  fastify.patch('/:id/notify', async (request, reply) => {
    const { id } = request.params;
    
    try {
      const result = await query(
        'UPDATE alerts SET notified = true WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Alert not found' });
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (err) {
      logger.error('Error updating alert:', err);
      reply.code(500).send({ error: 'Failed to update alert' });
    }
  });
  
  // GET /api/alerts/urgent - Get urgent unnotified alerts
  fastify.get('/urgent', async (request, reply) => {
    try {
      const result = await query(
        `SELECT * FROM alerts 
        WHERE priority IN ('critical', 'high') 
        AND notified = false 
        ORDER BY created_at DESC 
        LIMIT 10`
      );
      
      return {
        success: true,
        data: result.rows,
        count: result.rowCount
      };
    } catch (err) {
      logger.error('Error fetching urgent alerts:', err);
      reply.code(500).send({ error: 'Failed to fetch alerts' });
    }
  });
  
  // DELETE /api/alerts/:id - Delete alert
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    
    try {
      const result = await query(
        'DELETE FROM alerts WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return reply.code(404).send({ error: 'Alert not found' });
      }
      
      return {
        success: true,
        message: 'Alert deleted'
      };
    } catch (err) {
      logger.error('Error deleting alert:', err);
      reply.code(500).send({ error: 'Failed to delete alert' });
    }
  });
}
