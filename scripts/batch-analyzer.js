import dotenv from 'dotenv';
import { initDatabase, query } from '../backend/src/config/database.js';
import aiService from '../backend/src/services/ai/index.js';
import { notify } from '../backend/src/services/notifications.js';
import logger from '../backend/src/utils/logger.js';

dotenv.config({ path: './backend/.env' });

/**
 * Batch Analyzer — Runs nightly (via cron) to analyze accumulated social posts.
 * Uses local Ollama (free) for batch processing to keep costs at $0.
 *
 * Schedule: 0 3 * * * (3:00 AM daily)
 * Run manually: npm run batch (from backend/)
 */

const BATCH_SIZE = 20;

async function fetchUnanalyzedPosts() {
  try {
    const result = await query(
      `SELECT id, platform, author, content, posted_at
       FROM social_posts
       WHERE analyzed = false
       ORDER BY posted_at ASC
       LIMIT $1`,
      [BATCH_SIZE]
    );
    return result.rows;
  } catch (err) {
    logger.warn('Could not fetch posts (table may not exist yet):', err.message);
    return [];
  }
}

async function analyzePost(post) {
  try {
    const result = await aiService.analyzeSocialPost({
      content: post.content,
      urgent: false, // Batch mode = use Ollama
    });
    return result;
  } catch (err) {
    logger.error(`Failed to analyze post ${post.id}:`, err.message);
    return { is_airdrop: false, urgency: 'low', error: err.message };
  }
}

async function updatePost(postId, analysis) {
  try {
    await query(
      `UPDATE social_posts
       SET analyzed = true,
           is_airdrop = $2,
           urgency = $3,
           extracted_data = $4
       WHERE id = $1`,
      [
        postId,
        analysis.is_airdrop || false,
        analysis.urgency || 'low',
        JSON.stringify(analysis),
      ]
    );
  } catch (err) {
    logger.error(`Failed to update post ${postId}:`, err.message);
  }
}

async function createAlertFromAnalysis(post, analysis) {
  if (!analysis.is_airdrop) return;
  if (!['critical', 'high'].includes(analysis.urgency)) return;

  try {
    await query(
      `INSERT INTO alerts (airdrop_id, priority, title, message, source, source_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        null,
        analysis.urgency,
        `Airdrop detected: ${analysis.protocol || 'Unknown'}`,
        post.content.substring(0, 500),
        post.platform || 'social',
        null,
        JSON.stringify({ postId: post.id, analysis }),
      ]
    );

    // Notify via Telegram / Discord
    await notify(
      `🎯 New Airdrop: ${analysis.protocol || 'Unknown'}`,
      `${post.content.substring(0, 300)}\n\nChain: ${analysis.chain || '—'}\nUrgency: ${analysis.urgency}`,
      analysis.urgency
    );
  } catch (err) {
    logger.error('Failed to create alert:', err.message);
  }
}

async function main() {
  logger.info('🌙 Starting nightly batch analysis...');

  try {
    await initDatabase();

    const posts = await fetchUnanalyzedPosts();

    if (posts.length === 0) {
      logger.info('No unanalyzed posts found. Nothing to do.');
      process.exit(0);
    }

    logger.info(`Found ${posts.length} unanalyzed posts. Processing...`);

    let analyzed = 0;
    let airdropsFound = 0;
    let alertsCreated = 0;

    for (const post of posts) {
      const analysis = await analyzePost(post);
      await updatePost(post.id, analysis);
      analyzed++;

      if (analysis.is_airdrop) {
        airdropsFound++;
        if (['critical', 'high'].includes(analysis.urgency)) {
          await createAlertFromAnalysis(post, analysis);
          alertsCreated++;
        }
      }

      // Small delay to avoid hammering local Ollama
      await new Promise((r) => setTimeout(r, 500));
    }

    // Daily summary
    const summary = [
      `📊 Daily Batch Report`,
      `Posts analyzed: ${analyzed}`,
      `Airdrops found: ${airdropsFound}`,
      `Alerts created: ${alertsCreated}`,
    ].join('\n');

    logger.info(summary);

    // Send summary notification if anything was found
    if (airdropsFound > 0) {
      await notify('📊 Daily Batch Report', summary, 'normal');
    }

    logger.info('✅ Batch analysis completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Batch analysis failed:', error);
    process.exit(1);
  }
}

main();
