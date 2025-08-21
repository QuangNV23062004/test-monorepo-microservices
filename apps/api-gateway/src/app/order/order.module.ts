import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { ClientsModule } from '@nestjs/microservices';
import { ClientConfigsMap } from '../../utils/client-register';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap['AUTH_SERVICE'],
      ClientConfigsMap['ORDER_SERVICE'],
    ]),
  ],
  controllers: [OrderController],
})
export class OrderModule {}
