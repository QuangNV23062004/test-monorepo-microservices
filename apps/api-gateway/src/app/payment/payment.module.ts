import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { ClientConfigsMap } from '../../utils/client-register';
import { MomoController } from './momo-payment.controller';
import { PaypalController } from './paypal-payment.controller';
import { PaymentHelper } from './utils/payment-helper.utils';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap['AUTH_SERVICE'],
      ClientConfigsMap['PAYMENT_SERVICE'],
      ClientConfigsMap['PRODUCT_SERVICE'],
      ClientConfigsMap['USER_SERVICE'],
    ]),
  ],
  controllers: [MomoController, PaypalController],
  providers: [PaymentHelper],
})
export class PaymentModule {}
