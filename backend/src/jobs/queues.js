import Queue from 'bull';
import logger from '../utils/logger.js';

// Get Redis connection URL
const redisUrl = process.env.REDIS_URL;

// Ensure we gracefully handle preview environments without Redis
let queueImpl;

if (redisUrl) {
    queueImpl = new Queue('ai_robot_jobs', redisUrl, {
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 60000 // wait 1 min, then 2m, then 4m on failures
            },
            removeOnComplete: true, // Don't bloat Redis with old success logs
            removeOnFail: false
        }
    });
} else {
    logger.warn('⚠️ No REDIS_URL found. Bull Queues will run locally but persistence may fail.');
    // Fallback to local default if no url is provided
    queueImpl = new Queue('ai_robot_jobs', {
        defaultJobOptions: {
            attempts: 3,
            removeOnComplete: true
        }
    });
}

export const aiQueue = queueImpl;
