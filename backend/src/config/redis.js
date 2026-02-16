import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient;

export const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    logger.warn('⚠️  Redis URL not configured - caching disabled');
    return null;
  }
  
  if (redisClient) return redisClient;
  
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('❌ Redis max retries reached');
            return new Error('Redis max retries');
          }
          return retries * 100;
        }
      }
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });
    
    redisClient.on('connect', () => {
      logger.info('🔄 Redis connecting...');
    });
    
    redisClient.on('ready', () => {
      logger.info('✅ Redis connected and ready');
    });
    
    await redisClient.connect();
    return redisClient;
    
  } catch (err) {
    logger.error('❌ Redis connection failed:', err);
    logger.warn('⚠️  Continuing without cache');
    return null;
  }
};

export const getRedis = () => redisClient;

// Cache helper functions
const CACHE_TTL = parseInt(process.env.CACHE_TTL_HOURS || 24) * 3600; // Convert to seconds

export const cacheGet = async (key) => {
  if (!redisClient) return null;
  
  try {
    const data = await redisClient.get(key);
    if (data) {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(data);
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  } catch (err) {
    logger.error('Cache get error:', err);
    return null;
  }
};

export const cacheSet = async (key, value, ttl = CACHE_TTL) => {
  if (!redisClient) return false;
  
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (err) {
    logger.error('Cache set error:', err);
    return false;
  }
};

export const cacheDel = async (key) => {
  if (!redisClient) return false;
  
  try {
    await redisClient.del(key);
    logger.debug(`Cache DEL: ${key}`);
    return true;
  } catch (err) {
    logger.error('Cache del error:', err);
    return false;
  }
};

export const cacheInvalidatePattern = async (pattern) => {
  if (!redisClient) return false;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
    }
    return true;
  } catch (err) {
    logger.error('Cache invalidate pattern error:', err);
    return false;
  }
};

// Specialized cache functions
export const cacheEligibility = async (wallet, airdropId, data) => {
  const key = `eligibility:${wallet}:${airdropId}`;
  const ttl = 7 * 24 * 3600; // 7 days
  return cacheSet(key, data, ttl);
};

export const getCachedEligibility = async (wallet, airdropId) => {
  const key = `eligibility:${wallet}:${airdropId}`;
  return cacheGet(key);
};

export const cacheSocialPost = async (postId, platform, data) => {
  const key = `social:${platform}:${postId}`;
  const ttl = 24 * 3600; // 24 hours
  return cacheSet(key, data, ttl);
};

export const getCachedSocialPost = async (postId, platform) => {
  const key = `social:${platform}:${postId}`;
  return cacheGet(key);
};

export default {
  initRedis,
  getRedis,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheInvalidatePattern,
  cacheEligibility,
  getCachedEligibility,
  cacheSocialPost,
  getCachedSocialPost
};
