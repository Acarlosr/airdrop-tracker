import axios from 'axios';
import { getRedis } from '../config/redis.js';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

const CACHE_DURATION = 300; // 5 minutos

export const socialFeedService = {
  // Buscar tweets com airdrop keywords
  async fetchTwitterPosts(keywords = ['airdrop', 'claim', 'snapshot']) {
    try {
      if (!process.env.TWITTER_BEARER_TOKEN) {
        logger.warn('Twitter API token not configured - skipping Twitter posts');
        return [];
      }

      const query = keywords.join(' OR ');
      
      // Usar API v2 do Twitter (bearer token required)
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        },
        params: {
          query: `${query} lang:en -is:retweet`,
          max_results: 50,
          'tweet.fields': 'created_at,public_metrics',
          expansions: 'author_id',
          'user.fields': 'username,verified'
        },
        timeout: 5000
      });

      return (response.data.data || []).map((tweet, idx) => ({
        id: tweet.id || `twitter-${idx}`,
        text: tweet.text,
        created_at: tweet.created_at,
        author_id: tweet.author_id,
        public_metrics: tweet.public_metrics || {}
      }));
    } catch (error) {
      logger.warn('Twitter fetch error:', error.message);
      return [];
    }
  },

  // Buscar mensagens Discord (usando banco de dados)
  async fetchDiscordMessages(channelId = null) {
    try {
      if (!channelId) {
        logger.warn('Discord channel ID not configured');
        return [];
      }

      const redis = getRedis();
      const cacheKey = `discord:${channelId}`;
      
      // Verificar cache primeiro
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      }

      // Buscar do banco de dados (se houver tabela)
      try {
        const result = await query(
          'SELECT * FROM social_posts WHERE source = $1 ORDER BY created_at DESC LIMIT 50',
          ['discord']
        );

        const posts = result.rows || [];

        // Cache por 5 minutos
        if (redis) {
          await redis.setEx(cacheKey, CACHE_DURATION, JSON.stringify(posts));
        }

        return posts;
      } catch (dbError) {
        logger.debug('Database query error (expected if table not initialized):', dbError.message);
        return [];
      }
    } catch (error) {
      logger.warn('Discord fetch error:', error.message);
      return [];
    }
  },

  // Agregar ambas as fontes
  async getUnifiedFeed(options = {}) {
    const { limit = 50, skip = 0, keywords = [], source = 'all' } = options;

    try {
      const cacheKey = `unified_feed:${source}:${keywords.join(',')}`;
      const redis = getRedis();
      
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          const allPosts = JSON.parse(cached);
          return allPosts.slice(skip, skip + limit);
        }
      }

      // Buscar de ambas as fontes em paralelo
      let allPosts = [];

      if (source === 'all' || source === 'twitter') {
        const twitterPosts = await this.fetchTwitterPosts(keywords);
        const formattedTwitter = twitterPosts.map(post => ({
          id: `twitter-${post.id}`,
          source: 'twitter',
          author: post.author_id,
          content: post.text,
          timestamp: new Date(post.created_at),
          url: `https://twitter.com/i/web/status/${post.id}`,
          metrics: post.public_metrics
        }));
        allPosts = [...allPosts, ...formattedTwitter];
      }

      if (source === 'all' || source === 'discord') {
        const discordPosts = await this.fetchDiscordMessages(process.env.DISCORD_AIRDROP_CHANNEL);
        const formattedDiscord = discordPosts.map(post => ({
          id: `discord-${post.id || Math.random()}`,
          source: 'discord',
          author: post.author,
          content: post.content,
          timestamp: new Date(post.created_at),
          url: post.url || '#'
        }));
        allPosts = [...allPosts, ...formattedDiscord];
      }

      // Ordenar por timestamp (mais recentes primeiro)
      allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Cache
      if (redis) {
        await redis.setEx(cacheKey, CACHE_DURATION, JSON.stringify(allPosts));
      }

      // Paginar
      return allPosts.slice(skip, skip + limit);
    } catch (error) {
      logger.error('Unified feed error:', error);
      return [];
    }
  }
};

export default socialFeedService;
