import { aiQueue } from './queues.js';
import logger from '../utils/logger.js';
import aiRobot from '../services/ai-robot.js';

export async function startScheduler() {
    if (!aiRobot.isEnabled() || !aiQueue) {
        logger.info('[Scheduler] AI Robot is disabled or queue unavailable. Jobs will not be scheduled.');
        return;
    }

    const scanInterval = parseInt(process.env.AI_ROBOT_SCAN_INTERVAL) || 30; // in minutes
    const strategyInterval = parseInt(process.env.AI_ROBOT_STRATEGY_INTERVAL) || 120;

    logger.info(`[Scheduler] 🚀 Starting AI Robot Job Scheduler with Bull Queue`);

    try {
        // Clear old repeatable jobs to prevent overlapping when settings change
        const repeatableJobs = await aiQueue.getRepeatableJobs();
        for (const job of repeatableJobs) {
            await aiQueue.removeRepeatableByKey(job.key);
        }

        // Schedule Scan
        await aiQueue.add('ai_scan', {}, {
            repeat: { cron: `*/${scanInterval} * * * *` }
        });

        // Schedule Social Analysis
        await aiQueue.add('social_analysis', {}, {
            repeat: { cron: '0 * * * *' } // every hour
        });

        // Schedule Strategy
        const strategyMinutes = strategyInterval;
        const strategyCron = strategyMinutes >= 60
            ? `0 */${Math.floor(strategyMinutes / 60)} * * *`
            : `*/${strategyMinutes} * * * *`;

        await aiQueue.add('strategy_generation', {}, {
            repeat: { cron: strategyCron }
        });

        // Schedule Reminders
        await aiQueue.add('reminder_generation', {}, {
            repeat: { cron: '0 */6 * * *' } // every 6 hours
        });

        logger.info(`[Scheduler] ✅ Recurring jobs set: Scan(${scanInterval}m), Strategy(${strategyInterval}m)`);

        // Option to trigger the first pass instantly
        setTimeout(async () => {
            logger.info('[Scheduler] 🔄 Enqueueing initial quick startup jobs...');
            await aiQueue.add('ai_scan', {});
            await aiQueue.add('reminder_generation', {});
        }, 10000);

    } catch (err) {
        logger.error('[Scheduler] Failed to setup jobs:', err.message);
    }
}

export async function stopScheduler() {
    logger.info('[Scheduler] 🛑 Suspending queue processing...');
    if (aiQueue) {
        await aiQueue.pause();
    }
}

export default { startScheduler, stopScheduler };
