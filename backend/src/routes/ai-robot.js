import aiRobot from '../services/ai-robot.js';
import logger from '../utils/logger.js';

export default async function aiRobotRoutes(fastify, options) {

    // GET /api/ai-robot/status — Status do robô
    fastify.get('/status', async (request, reply) => {
        try {
            return {
                success: true,
                data: await aiRobot.getStatus(),
            };
        } catch (error) {
            logger.error('[AI Robot Route] Status error:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    // GET /api/ai-robot/insights — Últimos insights
    fastify.get('/insights', async (request, reply) => {
        try {
            const { limit = 20 } = request.query;
            return {
                success: true,
                data: await aiRobot.getInsights(parseInt(limit)),
            };
        } catch (error) {
            logger.error('[AI Robot Route] Insights error:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    // GET /api/ai-robot/reminders — Lembretes ativos
    fastify.get('/reminders', async (request, reply) => {
        try {
            const { limit = 20 } = request.query;
            return {
                success: true,
                data: await aiRobot.getReminders(parseInt(limit)),
            };
        } catch (error) {
            logger.error('[AI Robot Route] Reminders error:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    // POST /api/ai-robot/analyze — Disparar análise manual
    fastify.post('/analyze', async (request, reply) => {
        try {
            logger.info('[AI Robot Route] Enqueueing manual analysis jobs');

            const { aiQueue } = await import('../jobs/queues.js');

            if (!aiQueue) {
                throw new Error("Bull Queue not initialized");
            }

            await aiQueue.add('ai_scan', {});
            await aiQueue.add('strategy_generation', {});
            await aiQueue.add('social_analysis', {});
            await aiQueue.add('reminder_generation', {});

            return {
                success: true,
                data: {
                    status: 'queued',
                    message: "All analyses dispatched to the background worker pool."
                },
                timestamp: new Date(),
            };
        } catch (error) {
            logger.error('[AI Robot Route] Analyze error:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    // POST /api/ai-robot/toggle — Ligar/desligar robô
    fastify.post('/toggle', async (request, reply) => {
        try {
            const enabled = aiRobot.toggleRobot();
            logger.info(`[AI Robot Route] Robot toggled: ${enabled ? 'ON' : 'OFF'}`);
            return {
                success: true,
                data: { enabled },
            };
        } catch (error) {
            logger.error('[AI Robot Route] Toggle error:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });

    // POST /api/ai-robot/chat — Chat com o robô
    fastify.post('/chat', async (request, reply) => {
        try {
            const { message, userId = 'default' } = request.body;

            if (!message) {
                return reply.status(400).send({ success: false, error: 'Message is required' });
            }

            const result = await aiRobot.chatWithRobot(userId, message);

            return {
                success: true,
                data: result,
            };
        } catch (error) {
            logger.error('[AI Robot Route] Chat error:', error);
            return reply.status(500).send({ success: false, error: error.message });
        }
    });
}
