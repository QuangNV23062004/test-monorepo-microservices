import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { QueueModule } from './queue/queue.module';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RECEIPT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.RECEIPT_SERVICE_HOST || 'localhost',
          port: Number(process.env.RECEIPT_SERVICE_PORT) || 3004,
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST || 'localhost',
          port: Number(process.env.USER_SERVICE_PORT) || 3002,
        },
      },
    ]),
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
