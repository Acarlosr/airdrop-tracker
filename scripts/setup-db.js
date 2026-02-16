import dotenv from 'dotenv';
import { initDatabase, query } from '../src/config/database.js';
import logger from '../src/utils/logger.js';

dotenv.config();

/**
 * Database Setup Script
 * Creates tables and inserts sample data
 */

const sampleAirdrops = [
  {
    id: 'arbitrum-airdrop',
    name: 'Arbitrum Airdrop',
    protocol: 'Arbitrum',
    chain: 'arbitrum',
    status: 'active',
    total_supply: 12750000000,
    snapshot_date: '2023-02-06',
    claim_start: '2023-03-23',
    claim_end: null,
    criteria: {
      minTx: 4,
      minVolume: 0.1,
      snapshot: '2023-02-06'
    },
    links: {
      website: 'https://arbitrum.foundation',
      docs: 'https://docs.arbitrum.foundation'
    }
  },
  {
    id: 'optimism-airdrop-4',
    name: 'Optimism Airdrop #4',
    protocol: 'Optimism',
    chain: 'optimism',
    status: 'active',
    total_supply: 10343745,
    snapshot_date: '2024-01-10',
    claim_start: '2024-02-13',
    claim_end: null,
    criteria: {
      minTx: 5,
      minVolume: 0.05,
      snapshot: '2024-01-10',
      delegated: true
    },
    links: {
      website: 'https://optimism.io',
      claim: 'https://app.optimism.io/airdrop'
    }
  },
  {
    id: 'base-airdrop',
    name: 'Base Network Airdrop',
    protocol: 'Base',
    chain: 'base',
    status: 'rumored',
    total_supply: null,
    snapshot_date: null,
    claim_start: null,
    claim_end: null,
    criteria: {
      minTx: 10,
      minVolume: 0.5,
      earlyUser: true
    },
    links: {
      website: 'https://base.org'
    }
  }
];

async function insertSampleData() {
  logger.info('Inserting sample airdrops...');
  
  for (const airdrop of sampleAirdrops) {
    try {
      await query(
        `INSERT INTO airdrops 
        (id, name, protocol, chain, status, total_supply, snapshot_date, claim_start, claim_end, criteria, links)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING`,
        [
          airdrop.id,
          airdrop.name,
          airdrop.protocol,
          airdrop.chain,
          airdrop.status,
          airdrop.total_supply,
          airdrop.snapshot_date,
          airdrop.claim_start,
          airdrop.claim_end,
          JSON.stringify(airdrop.criteria),
          JSON.stringify(airdrop.links)
        ]
      );
      logger.info(`✅ Inserted: ${airdrop.name}`);
    } catch (error) {
      logger.error(`❌ Failed to insert ${airdrop.name}:`, error.message);
    }
  }
  
  // Insert sample wallet from env if available
  if (process.env.WALLET_ADDRESSES) {
    const wallets = process.env.WALLET_ADDRESSES.split(',');
    for (const wallet of wallets) {
      try {
        await query(
          `INSERT INTO wallets (address, label, watch_enabled)
          VALUES ($1, $2, $3)
          ON CONFLICT (address) DO NOTHING`,
          [wallet.trim().toLowerCase(), 'Main Wallet', true]
        );
        logger.info(`✅ Inserted wallet: ${wallet}`);
      } catch (error) {
        logger.error(`❌ Failed to insert wallet:`, error.message);
      }
    }
  }
}

async function main() {
  try {
    logger.info('🚀 Setting up database...');
    
    // Initialize database (creates tables)
    await initDatabase();
    
    // Insert sample data
    await insertSampleData();
    
    logger.info('✅ Database setup completed');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

main();
