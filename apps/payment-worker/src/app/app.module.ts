import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { QueueModule } from './queue/queue.module';
import { getClient } from '@nest-microservices/shared-utils';

@Module({
  imports: [
    ClientsModule.register([
      getClient('RECEIPT_SERVICE', Transport.TCP, 'localhost', 3004),
      getClient('USER_SERVICE', Transport.TCP, 'localhost', 3002),
      getClient('ORDER_SERVICE', Transport.TCP, 'localhost', 3006),
      getClient('PRODUCT_SERVICE', Transport.TCP, 'localhost', 3007),
    ]),
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
