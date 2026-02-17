import socialFeedService from '../services/social-feed.js';
import logger from '../utils/logger.js';

export default async function socialRoutes(fastify, options) {
  
  // GET /api/social/feed
  fastify.get('/feed', async (request, reply) => {
    try {
      const { limit = 50, skip = 0, keywords = '', source = 'all' } = request.query;
      
      const keywordArray = keywords ? keywords.split(',').filter(k => k.trim()) : [];
      
      const posts = await socialFeedService.getUnifiedFeed({
        limit: parseInt(limit),
        skip: parseInt(skip),
        keywords: keywordArray,
        source
      });

      logger.info(`Social feed fetched: ${posts.length} posts`);

      return {
        success: true,
        posts,
        total: posts.length
      };
    } catch (error) {
      logger.error('Social feed error:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false,
        posts: []
      });
    }
  });

  // GET /api/social/feed/twitter
  fastify.get('/feed/twitter', async (request, reply) => {
    try {
      const { keywords = '' } = request.query;
      
      const keywordArray = keywords ? keywords.split(',').filter(k => k.trim()) : ['airdrop', 'claim'];
      
      const posts = await socialFeedService.getUnifiedFeed({
        limit: 50,
        skip: 0,
        keywords: keywordArray,
        source: 'twitter'
      });

      return {
        success: true,
        posts,
        source: 'twitter'
      };
    } catch (error) {
      logger.error('Twitter feed error:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false
      });
    }
  });

  // GET /api/social/feed/discord
  fastify.get('/feed/discord', async (request, reply) => {
    try {
      const posts = await socialFeedService.getUnifiedFeed({
        limit: 50,
        skip: 0,
        keywords: [],
        source: 'discord'
      });

      return {
        success: true,
        posts,
        source: 'discord'
      };
    } catch (error) {
      logger.error('Discord feed error:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false
      });
    }
  });

  // POST /api/social/search
  fastify.post('/search', async (request, reply) => {
    try {
      const { query, source = 'all', limit = 50 } = request.body;

      if (!query) {
        return reply.status(400).send({ 
          error: 'Query required',
          success: false
        });
      }

      const posts = await socialFeedService.getUnifiedFeed({
        limit,
        skip: 0,
        keywords: [query],
        source
      });

      return {
        success: true,
        posts,
        query,
        count: posts.length
      };
    } catch (error) {
      logger.error('Search error:', error);
      return reply.status(500).send({ 
        error: error.message,
        success: false
      });
    }
  });
}
