import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const logger = new Logger('ProductService - RedisClient');

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject('RedisClient') private readonly redis: Redis) {}
  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
      logger.log('Redis connection closed');
    } catch (error) {
      logger.error(
        'Error closing Redis connection:',
        error instanceof Error ? error.message : error
      );
    }
  }

  async set(
    key: string,
    value: string,
    expireInSeconds?: number
  ): Promise<boolean> {
    logger.log(
      `Caching redis key with key: ${key}, value: ${value}, ${
        expireInSeconds ? `expiresIn: ${expireInSeconds} seconds` : ``
      }`
    );
    try {
      if (expireInSeconds) {
        await this.redis.set(key, value, 'EX', expireInSeconds);
        return true;
      }

      await this.redis.set(key, value);
      return true;
    } catch (error) {
      logger.error(
        `Failed to cache redis for  key: ${key}, value: ${value}, ${
          expireInSeconds ? `expiresIn: ${expireInSeconds} seconds` : ``
        } : ${error instanceof Error ? error.message : error}`
      );
    }
  }

  async get(key: string): Promise<string | null> {
    logger.log(`Retrieving value from redis for key: ${key}`);
    try {
      return await this.redis.get(key);
    } catch (error) {
      logger.error(
        `Failed to get value with key: ${key}, error: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async del(key: string): Promise<void> {
    logger.log(`Deleting value from redis for key: ${key}`);
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error(
        `Failed to delete value with key: ${key}, error: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }
}
