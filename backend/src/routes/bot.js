import { processMessage } from '../services/simple-bot.js';
import { getRedis } from '../config/redis.js';
import logger from '../utils/logger.js';

export default async function botRoutes(fastify, options) {
  
  // POST /api/bot/message
  fastify.post('/message', async (request, reply) => {
    try {
      const { message, wallet } = request.body;

      if (!message || !wallet) {
        return reply.status(400).send({ 
          error: 'Message and wallet required',
          success: false 
        });
      }

      // Usar wallet como user ID (lowercase para consistência)
      const userId = wallet.toLowerCase();

      // Buscar histórico da conversa do Redis se disponível
      let history = [];
      const redis = getRedis();
      if (redis) {
        const historyKey = `chat_history:${userId}`;
        const cachedHistory = await redis.get(historyKey);
        if (cachedHistory) {
          history = JSON.parse(cachedHistory);
        }
      }

      // Processar mensagem
      const result = await processMessage(userId, message, wallet, history);

      // Salvar no histórico (Redis se disponível)
      if (redis) {
        const historyKey = `chat_history:${userId}`;
        history.push({ role: 'user', content: message });
        history.push({ role: 'assistant', content: result.response });
        
        // Manter apenas últimas 40 mensagens
        if (history.length > 40) {
          history = history.slice(-40);
        }
        
        await redis.setEx(historyKey, 86400, JSON.stringify(history)); // 24 horas
      }

      logger.info(`Bot message processed for wallet: ${wallet}`);

      return {
        success: true,
        response: result.response,
        actions: result.actions,
        timestamp: result.timestamp
      };
    } catch (error) {
      logger.error('Bot route error:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false,
        response: 'Erro ao processar sua mensagem',
        actions: []
      });
    }
  });

  // GET /api/bot/history/:wallet
  fastify.get('/history/:wallet', async (request, reply) => {
    try {
      const { wallet } = request.params;
      const userId = wallet.toLowerCase();

      let history = [];
      const redis = getRedis();
      if (redis) {
        const historyKey = `chat_history:${userId}`;
        const cachedHistory = await redis.get(historyKey);
        if (cachedHistory) {
          history = JSON.parse(cachedHistory);
        }
      }

      return {
        success: true,
        history
      };
    } catch (error) {
      logger.error('Bot history error:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false
      });
    }
  });

  // DELETE /api/bot/history/:wallet (limpar histórico)
  fastify.delete('/history/:wallet', async (request, reply) => {
    try {
      const { wallet } = request.params;
      const userId = wallet.toLowerCase();

      const redis = getRedis();
      if (redis) {
        const historyKey = `chat_history:${userId}`;
        await redis.del(historyKey);
      }

      return {
        success: true,
        message: 'Histórico limpo com sucesso'
      };
    } catch (error) {
      logger.error('Bot history delete error:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false
      });
    }
  });
}
