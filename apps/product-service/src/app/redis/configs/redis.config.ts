import dotenv from 'dotenv';
import { registerAs } from '@nestjs/config';
dotenv.config();

export const redisConfig = registerAs('redis', () => ({
  redisUrl: process.env.REDIS_URL,
}));
