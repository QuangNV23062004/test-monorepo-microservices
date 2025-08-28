import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import {
  ClientConfigsMap,
  MICROSERVICE_CLIENTS,
} from '../../utils/client-register.utils';
import { MomoController } from './momo-payment.controller';
import { PaypalController } from './paypal-payment.controller';
import { PaymentHelper } from './utils/payment-helper.utils';
import { VnpayController } from './vnpay-payment.controller';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap[MICROSERVICE_CLIENTS.AUTH_SERVICE],
      ClientConfigsMap[MICROSERVICE_CLIENTS.PAYMENT_SERVICE],
      ClientConfigsMap[MICROSERVICE_CLIENTS.PRODUCT_SERVICE],
      ClientConfigsMap[MICROSERVICE_CLIENTS.USER_SERVICE],
    ]),
  ],
  controllers: [MomoController, PaypalController, VnpayController],
  providers: [PaymentHelper],
})
export class PaymentModule {}
