/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport } from '@nestjs/microservices';
const logger = new Logger('ReceiptService');

async function bootstrap() {
  const transport = Number(process.env.TRANSPORT) || Transport.TCP;
  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT) || 3004;
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: transport,
    options: {
      host: host,
      port: port,
    },
  });

  await app.listen();
  logger.log(`Receipt Service is running on port ${process.env.PORT || 3004}`);
}

bootstrap();
