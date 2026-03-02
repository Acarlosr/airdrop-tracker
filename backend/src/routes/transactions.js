import { query } from '../config/database.js';
import logger from '../utils/logger.js';

export default async function transactionRoutes(fastify, options) {

    // GET /api/transactions - List transactions with filters
    fastify.get('/', async (request, reply) => {
        const { type, airdrop_id, chain, limit = 50, offset = 0, from, to } = request.query;

        let sql = `
      SELECT t.*, a.name as airdrop_name
      FROM transactions t
      LEFT JOIN airdrops a ON t.airdrop_id = a.id
      WHERE 1=1
    `;
        const params = [];
        let idx = 1;

        if (type) {
            sql += ` AND t.type = $${idx++}`;
            params.push(type);
        }
        if (airdrop_id) {
            sql += ` AND t.airdrop_id = $${idx++}`;
            params.push(airdrop_id);
        }
        if (chain) {
            sql += ` AND t.chain = $${idx++}`;
            params.push(chain);
        }
        if (from) {
            sql += ` AND t.tx_date >= $${idx++}`;
            params.push(from);
        }
        if (to) {
            sql += ` AND t.tx_date <= $${idx++}`;
            params.push(to);
        }

        sql += ` ORDER BY t.tx_date DESC LIMIT $${idx++} OFFSET $${idx++}`;
        params.push(limit, offset);

        try {
            const result = await query(sql, params);
            return {
                success: true,
                data: result.rows,
                pagination: { limit: parseInt(limit), offset: parseInt(offset), total: result.rowCount }
            };
        } catch (err) {
            logger.error('Error fetching transactions:', err);
            reply.code(500).send({ error: 'Failed to fetch transactions' });
        }
    });

    // GET /api/transactions/summary - Aggregated P&L
    fastify.get('/summary', async (request, reply) => {
        try {
            // Overall totals by type
            const totalsResult = await query(`
        SELECT
          type,
          COUNT(*) as count,
          COALESCE(SUM(value_usd), 0) as total_usd
        FROM transactions
        GROUP BY type
      `);

            const totals = {};
            for (const row of totalsResult.rows) {
                totals[row.type] = { count: parseInt(row.count), total_usd: parseFloat(row.total_usd) };
            }

            const invested = (totals.invest?.total_usd || 0) + (totals.gas?.total_usd || 0) + (totals.fee?.total_usd || 0);
            const claimed = totals.claim?.total_usd || 0;
            const swapped = totals.swap?.total_usd || 0;

            // P&L by airdrop
            const byAirdropResult = await query(`
        SELECT
          t.airdrop_id,
          a.name as airdrop_name,
          a.chain,
          SUM(CASE WHEN t.type IN ('invest', 'gas', 'fee') THEN COALESCE(t.value_usd, 0) ELSE 0 END) as total_spent,
          SUM(CASE WHEN t.type = 'claim' THEN COALESCE(t.value_usd, 0) ELSE 0 END) as total_claimed,
          SUM(CASE WHEN t.type = 'swap' THEN COALESCE(t.value_usd, 0) ELSE 0 END) as total_swapped,
          COUNT(*) as tx_count
        FROM transactions t
        LEFT JOIN airdrops a ON t.airdrop_id = a.id
        WHERE t.airdrop_id IS NOT NULL
        GROUP BY t.airdrop_id, a.name, a.chain
        ORDER BY total_claimed DESC
      `);

            // Monthly evolution
            const monthlyResult = await query(`
        SELECT
          TO_CHAR(tx_date, 'YYYY-MM') as month,
          SUM(CASE WHEN type IN ('invest', 'gas', 'fee') THEN COALESCE(value_usd, 0) ELSE 0 END) as spent,
          SUM(CASE WHEN type = 'claim' THEN COALESCE(value_usd, 0) ELSE 0 END) as claimed
        FROM transactions
        WHERE tx_date >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(tx_date, 'YYYY-MM')
        ORDER BY month ASC
      `);

            return {
                success: true,
                data: {
                    totals,
                    invested,
                    claimed,
                    swapped,
                    netPnl: claimed + swapped - invested,
                    byAirdrop: byAirdropResult.rows.map(r => ({
                        ...r,
                        total_spent: parseFloat(r.total_spent),
                        total_claimed: parseFloat(r.total_claimed),
                        total_swapped: parseFloat(r.total_swapped),
                        pnl: parseFloat(r.total_claimed) + parseFloat(r.total_swapped) - parseFloat(r.total_spent)
                    })),
                    monthly: monthlyResult.rows.map(r => ({
                        month: r.month,
                        spent: parseFloat(r.spent),
                        claimed: parseFloat(r.claimed),
                        pnl: parseFloat(r.claimed) - parseFloat(r.spent)
                    }))
                }
            };
        } catch (err) {
            logger.error('Error fetching transaction summary:', err);
            reply.code(500).send({ error: 'Failed to fetch summary' });
        }
    });

    // POST /api/transactions - Create transaction
    fastify.post('/', async (request, reply) => {
        const {
            type, airdrop_id, wallet_address, token,
            amount, value_usd, chain, tx_hash,
            from_token, from_amount, notes, tx_date
        } = request.body;

        if (!type || !token) {
            return reply.code(400).send({ error: 'Missing required fields: type, token' });
        }

        const validTypes = ['invest', 'claim', 'swap', 'gas', 'fee'];
        if (!validTypes.includes(type)) {
            return reply.code(400).send({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        }

        try {
            const result = await query(
                `INSERT INTO transactions
        (type, airdrop_id, wallet_address, token, amount, value_usd, chain, tx_hash, from_token, from_amount, notes, tx_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
                [type, airdrop_id || null, wallet_address || null, token,
                    amount || null, value_usd || null, chain || null, tx_hash || null,
                    from_token || null, from_amount || null, notes || null, tx_date || new Date()]
            );

            logger.info(`Transaction created: ${type} ${amount} ${token}`);
            return { success: true, data: result.rows[0] };
        } catch (err) {
            logger.error('Error creating transaction:', err);
            reply.code(500).send({ error: 'Failed to create transaction' });
        }
    });

    // PATCH /api/transactions/:id - Update transaction
    fastify.patch('/:id', async (request, reply) => {
        const { id } = request.params;
        const updates = request.body;

        const allowed = ['type', 'airdrop_id', 'wallet_address', 'token', 'amount', 'value_usd',
            'chain', 'tx_hash', 'from_token', 'from_amount', 'notes', 'tx_date'];
        const fields = Object.keys(updates).filter(k => allowed.includes(k));

        if (fields.length === 0) {
            return reply.code(400).send({ error: 'No valid fields to update' });
        }

        const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
        const values = [id, ...fields.map(f => updates[f])];

        try {
            const result = await query(
                `UPDATE transactions SET ${setClause} WHERE id = $1 RETURNING *`,
                values
            );

            if (result.rows.length === 0) {
                return reply.code(404).send({ error: 'Transaction not found' });
            }

            return { success: true, data: result.rows[0] };
        } catch (err) {
            logger.error('Error updating transaction:', err);
            reply.code(500).send({ error: 'Failed to update transaction' });
        }
    });

    // DELETE /api/transactions/:id - Delete transaction
    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params;

        try {
            const result = await query('DELETE FROM transactions WHERE id = $1 RETURNING id', [id]);

            if (result.rows.length === 0) {
                return reply.code(404).send({ error: 'Transaction not found' });
            }

            return { success: true, deleted: true };
        } catch (err) {
            logger.error('Error deleting transaction:', err);
            reply.code(500).send({ error: 'Failed to delete transaction' });
        }
    });
}
