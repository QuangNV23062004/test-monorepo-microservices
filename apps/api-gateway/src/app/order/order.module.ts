import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { ClientsModule } from '@nestjs/microservices';
import {
  ClientConfigsMap,
  MICROSERVICE_CLIENTS,
} from '../../utils/client-register.utils';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap[MICROSERVICE_CLIENTS.AUTH_SERVICE],
      ClientConfigsMap[MICROSERVICE_CLIENTS.ORDER_SERVICE],
    ]),
  ],
  controllers: [OrderController],
})
export class OrderModule {}
