import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { QueueModule } from './queue/queue.module';
import { getClient } from '@nest-microservices/shared-utils';
import { MicroserviceClients } from '../utils/client-register.utils';

@Module({
  imports: [ClientsModule.register(MicroserviceClients), QueueModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
