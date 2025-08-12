import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { ClientsModule } from '@nestjs/microservices';
import { ClientConfigsMap } from '../../utils/client-register';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap['AUTH_SERVICE'],
      ClientConfigsMap['PAYMENT_SERVICE'],
    ]),
  ],
  controllers: [PaymentController],
})
export class PaymentModule {}
