import { query } from '../config/database.js';
import logger from '../utils/logger.js';

export default async function analyticsRoutes(fastify, options) {
  
  // GET /api/analytics/dashboard - Get dashboard stats
  fastify.get('/dashboard', async (request, reply) => {
    try {
      const stats = {};
      
      // Active airdrops count
      const airdropsResult = await query(
        "SELECT COUNT(*) as count FROM airdrops WHERE status = 'active'"
      );
      stats.activeAirdrops = parseInt(airdropsResult.rows[0]?.count ?? "0");
      
      // Monitored wallets count
      const walletsResult = await query(
        'SELECT COUNT(*) as count FROM wallets WHERE watch_enabled = true'
      );
      stats.monitoredWallets = parseInt(walletsResult.rows[0]?.count ?? "0");
      
      // Total eligible checks
      const eligibleResult = await query(
        'SELECT COUNT(*) as count FROM eligibility_checks WHERE is_eligible = true'
      );
      stats.eligibleChecks = parseInt(eligibleResult.rows[0]?.count ?? "0");
      
      // Pending alerts
      const alertsResult = await query(
        'SELECT COUNT(*) as count FROM alerts WHERE notified = false'
      );
      stats.pendingAlerts = parseInt(alertsResult.rows[0]?.count ?? "0");
      
      // Recent activity (last 7 days)
      const activityResult = await query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM alerts
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC`
      );
      stats.recentActivity = activityResult.rows;
      
      return {
        success: true,
        data: stats
      };
    } catch (err) {
      logger.error('Error fetching dashboard stats:', err);
      reply.code(500).send({ error: 'Failed to fetch stats' });
    }
  });
  
  // GET /api/analytics/airdrops - Airdrop analytics
  fastify.get('/airdrops', async (request, reply) => {
    try {
      // Airdrops by chain
      const chainResult = await query(
        `SELECT chain, COUNT(*) as count
        FROM airdrops
        WHERE status = 'active'
        GROUP BY chain
        ORDER BY count DESC`
      );
      
      // Airdrops by status
      const statusResult = await query(
        `SELECT status, COUNT(*) as count
        FROM airdrops
        GROUP BY status`
      );
      
      // Top airdrops by eligible wallets
      const topResult = await query(
        `SELECT 
          a.id,
          a.name,
          a.chain,
          COUNT(ec.id) as eligible_count
        FROM airdrops a
        LEFT JOIN eligibility_checks ec ON a.id = ec.airdrop_id AND ec.is_eligible = true
        WHERE a.status = 'active'
        GROUP BY a.id, a.name, a.chain
        ORDER BY eligible_count DESC
        LIMIT 10`
      );
      
      return {
        success: true,
        data: {
          byChain: chainResult.rows,
          byStatus: statusResult.rows,
          topAirdrops: topResult.rows
        }
      };
    } catch (err) {
      logger.error('Error fetching airdrop analytics:', err);
      reply.code(500).send({ error: 'Failed to fetch analytics' });
    }
  });
  
  // GET /api/analytics/wallets/:address - Wallet analytics
  fastify.get('/wallets/:address', async (request, reply) => {
    const { address } = request.params;
    const walletAddress = address.toLowerCase();
    
    try {
      // Eligibility summary
      const summaryResult = await query(
        `SELECT 
          COUNT(*) as total_checked,
          SUM(CASE WHEN is_eligible THEN 1 ELSE 0 END) as eligible_count,
          AVG(score) as avg_score
        FROM eligibility_checks
        WHERE wallet_address = $1`,
        [walletAddress]
      );
      
      // Eligible airdrops
      const eligibleResult = await query(
        `SELECT 
          a.id,
          a.name,
          a.chain,
          ec.score,
          ec.allocation,
          ec.checked_at
        FROM eligibility_checks ec
        JOIN airdrops a ON ec.airdrop_id = a.id
        WHERE ec.wallet_address = $1 AND ec.is_eligible = true
        ORDER BY ec.score DESC`,
        [walletAddress]
      );
      
      // Activity by chain
      const chainActivityResult = await query(
        `SELECT 
          wt.chain,
          COUNT(*) as tx_count,
          SUM(wt.value) as total_volume
        FROM wallet_transactions wt
        WHERE wt.wallet_address = $1
        GROUP BY wt.chain
        ORDER BY tx_count DESC`,
        [walletAddress]
      );
      
      return {
        success: true,
        data: {
          summary: summaryResult.rows[0],
          eligibleAirdrops: eligibleResult.rows,
          chainActivity: chainActivityResult.rows
        }
      };
    } catch (err) {
      logger.error('Error fetching wallet analytics:', err);
      reply.code(500).send({ error: 'Failed to fetch analytics' });
    }
  });
  
  // GET /api/analytics/activity - Recent activity timeline
  fastify.get('/activity', async (request, reply) => {
    const { days = 30 } = request.query;
    
    try {
      const result = await query(
        `SELECT 
          DATE(created_at) as date,
          'alert' as type,
          priority,
          COUNT(*) as count
        FROM alerts
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at), priority
        
        UNION ALL
        
        SELECT 
          DATE(checked_at) as date,
          'eligibility' as type,
          CASE WHEN is_eligible THEN 'eligible' ELSE 'not_eligible' END as priority,
          COUNT(*) as count
        FROM eligibility_checks
        WHERE checked_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(checked_at), is_eligible
        
        ORDER BY date DESC, type`,
        []
      );
      
      return {
        success: true,
        data: result.rows
      };
    } catch (err) {
      logger.error('Error fetching activity:', err);
      reply.code(500).send({ error: 'Failed to fetch activity' });
    }
  });
}
