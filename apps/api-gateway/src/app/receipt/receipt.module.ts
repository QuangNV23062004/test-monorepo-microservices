import { Module } from '@nestjs/common';
import { ReceiptController } from './receipt.controller';
import { ClientsModule } from '@nestjs/microservices';
import { ClientConfigsMap } from '../../utils/client-register';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap['AUTH_SERVICE'],
      ClientConfigsMap['RECEIPT_SERVICE'],
    ]),
  ],
  controllers: [ReceiptController],
})
export class ReceiptModule {}
