import { aiQueue } from './queues.js';
import aiRobot from '../services/ai-robot.js';
import { socialFeedService } from '../services/social-feed.js';
import { getPool } from '../config/database.js';
import logger from '../utils/logger.js';

logger.info('[Worker] 🏗️ Initializing AI Robot Worker Process...');

// 1. Airdrop Scan Job
aiQueue.process('ai_scan', async (job) => {
    logger.info(`[Worker] Started job ai_scan [${job.id}]`);
    const db = getPool();
    const result = await aiRobot.scanAirdrops(db);
    return result;
});

// 2. Social Media Analysis Job
aiQueue.process('social_analysis', async (job) => {
    logger.info(`[Worker] Started job social_analysis [${job.id}]`);
    const result = await aiRobot.analyzeSocial(socialFeedService);
    return result;
});

// 3. Strategy Generation Job
aiQueue.process('strategy_generation', async (job) => {
    logger.info(`[Worker] Started job strategy_generation [${job.id}]`);
    const db = getPool();
    const result = await aiRobot.generateStrategy(db);
    return result;
});

// 4. Reminder Generation Job
aiQueue.process('reminder_generation', async (job) => {
    logger.info(`[Worker] Started job reminder_generation [${job.id}]`);
    const db = getPool();
    const result = await aiRobot.generateReminders(db);
    return result;
});

// Event Listeners for logging
aiQueue.on('completed', (job, result) => {
    logger.info(`[Worker] ✅ Job ${job.name} [${job.id}] completed successfully.`);
});

aiQueue.on('failed', (job, err) => {
    logger.error(`[Worker] ❌ Job ${job.name} [${job.id}] failed on attempt ${job.attemptsMade}! Reason: ${err.message}`);
});
