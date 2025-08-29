import { Module } from '@nestjs/common';
import { ReceiptController } from './receipt.controller';
import { ClientsModule } from '@nestjs/microservices';
import {
  ClientConfigsMap,
  MICROSERVICE_CLIENTS,
} from '../../utils/client-register.utils';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap[MICROSERVICE_CLIENTS.AUTH_SERVICE],
      ClientConfigsMap[MICROSERVICE_CLIENTS.RECEIPT_SERVICE],
    ]),
  ],
  controllers: [ReceiptController],
})
export class ReceiptModule {}
