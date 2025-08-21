/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

const logger = new Logger('PaymentWorker');

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    await app.init();
    logger.log('🔄 Payment Worker microservice started');
    // logger.log(`💻 Worker PID: ${process.pid}`);
    // logger.log(`⏱️  Worker started at: ${new Date().toISOString()}`);

    process.on('SIGTERM', async () => {
      logger.log('SIGTERM received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('SIGINT received, shutting down gracefully');
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start payment worker:', error);
    process.exit(1);
  }
}

bootstrap();
