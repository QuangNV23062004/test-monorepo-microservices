import { FactoryProvider, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Redis } from 'ioredis';
import { redisConfig } from './configs/redis.config';

const logger = new Logger('ProductService - RedisClient');
export const redisClientFactory: FactoryProvider<Redis> = {
  provide: 'RedisClient',
  useFactory: (config: ConfigType<typeof redisConfig>) => {
    if (!config.redisUrl) {
      logger.error('REDIS_URL not properly set or config in environment');
    }

    const redisInstance = new Redis(config.redisUrl, {
      connectTimeout: 10000,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        logger.debug(`Redis connection retry attempt ${times} in ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 5,
    });

    redisInstance.on('error', (e) => {
      logger.error('Redis connection error:', e);
    });

    redisInstance.on('connect', () => {
      logger.log('Connected to Redis server');
    });

    redisInstance.on('ready', () => {
      logger.log('Redis client is ready');
    });

    return redisInstance;
  },
  inject: [redisConfig.KEY],
};
