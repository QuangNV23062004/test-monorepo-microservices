import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigModule } from '@nestjs/config';
import { redisConfig } from './configs/redis.config';
import { redisClientFactory } from './redis-client.factory';

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [RedisService, redisClientFactory],
  exports: [RedisService],
})
export class RedisModule {}
