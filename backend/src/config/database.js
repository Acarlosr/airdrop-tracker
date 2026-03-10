import pkg from 'pg';
const { Pool } = pkg;
import logger from '../utils/logger.js';

let pool;

export const initDatabase = async () => {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) {
    logger.warn('⚠️ DATABASE_URL not set - running without database (preview mode)');
    return null;
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_SIZE) || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  try {
    const client = await pool.connect();
    logger.info('✅ Database connected successfully');
    client.release();
    await createTables();
    return pool;
  } catch (err) {
    logger.error('❌ Database connection failed:', err.message);
    logger.warn('⚠️ Running without database (preview mode)');
    pool = null;
    return null;
  }
};

export const getPool = () => pool || null;

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Airdrops table
    await client.query(`
      CREATE TABLE IF NOT EXISTS airdrops (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        protocol VARCHAR(100),
        chain VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        total_supply BIGINT,
        snapshot_date TIMESTAMP,
        claim_start TIMESTAMP,
        claim_end TIMESTAMP,
        criteria JSONB,
        links JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Wallets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        address VARCHAR(42) PRIMARY KEY,
        label VARCHAR(100),
        watch_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Eligibility checks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS eligibility_checks (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) REFERENCES wallets(address),
        airdrop_id VARCHAR(100) REFERENCES airdrops(id),
        is_eligible BOOLEAN,
        score INTEGER,
        criteria_met JSONB,
        allocation DECIMAL(20, 8),
        checked_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Alerts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        airdrop_id VARCHAR(100) REFERENCES airdrops(id),
        priority VARCHAR(20) DEFAULT 'normal',
        title VARCHAR(255),
        message TEXT,
        source VARCHAR(50),
        source_url VARCHAR(500),
        metadata JSONB,
        notified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Social posts cache
    await client.query(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id VARCHAR(100) PRIMARY KEY,
        platform VARCHAR(20),
        author VARCHAR(100),
        content TEXT,
        analyzed BOOLEAN DEFAULT false,
        is_airdrop BOOLEAN,
        urgency VARCHAR(20),
        extracted_data JSONB,
        posted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Transactions history
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(42) REFERENCES wallets(address),
        chain VARCHAR(50),
        tx_hash VARCHAR(66),
        block_number BIGINT,
        from_address VARCHAR(42),
        to_address VARCHAR(42),
        value DECIMAL(30, 18),
        protocol VARCHAR(100),
        tx_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tx_hash, wallet_address)
      );
    `);

    // Financial transactions table (investments, claims, swaps, gas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        airdrop_id VARCHAR(100) REFERENCES airdrops(id) ON DELETE SET NULL,
        wallet_address VARCHAR(42),
        token VARCHAR(50) NOT NULL,
        amount DECIMAL(30, 18),
        value_usd DECIMAL(20, 2),
        chain VARCHAR(50),
        tx_hash VARCHAR(66),
        from_token VARCHAR(50),
        from_amount DECIMAL(30, 18),
        notes TEXT,
        tx_date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // AI Robot Insights table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50),
        priority VARCHAR(20),
        title VARCHAR(255),
        summary TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // AI Robot Reminders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_reminders (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50),
        priority VARCHAR(20),
        airdrop VARCHAR(100),
        title VARCHAR(255),
        message TEXT,
        deadline TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_airdrops_status ON airdrops(status);
      CREATE INDEX IF NOT EXISTS idx_airdrops_chain ON airdrops(chain);
      CREATE INDEX IF NOT EXISTS idx_eligibility_wallet ON eligibility_checks(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_eligibility_airdrop ON eligibility_checks(airdrop_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);
      CREATE INDEX IF NOT EXISTS idx_alerts_notified ON alerts(notified);
      CREATE INDEX IF NOT EXISTS idx_social_analyzed ON social_posts(analyzed);
      CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON wallet_transactions(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_transactions_chain ON wallet_transactions(chain);
      CREATE INDEX IF NOT EXISTS idx_fin_tx_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_fin_tx_airdrop ON transactions(airdrop_id);
      CREATE INDEX IF NOT EXISTS idx_fin_tx_wallet ON transactions(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_fin_tx_date ON transactions(tx_date);
      CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(type);
      CREATE INDEX IF NOT EXISTS idx_ai_insights_created ON ai_insights(created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_reminders_type ON ai_reminders(type);
      CREATE INDEX IF NOT EXISTS idx_ai_reminders_airdrop ON ai_reminders(airdrop);
    `);

    await client.query('COMMIT');
    logger.info('✅ Database tables created/verified');

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Error creating tables:', err);
    throw err;
  } finally {
    client.release();
  }
};

export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  logger.debug('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

export default { initDatabase, getPool, query };
