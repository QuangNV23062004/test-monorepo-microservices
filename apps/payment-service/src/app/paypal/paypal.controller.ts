import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaypalService } from './paypal.service';
import { IProductItem } from '@nest-microservices/shared-interfaces';

const logger = new Logger('PaymentService - Paypal');
@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  @MessagePattern('payment.paypal.create')
  async createPaypalPayment(
    @Payload()
    data: {
      userId: string;
      productList: IProductItem[];
      returnUrl: string;
      cancelUrl: string;
      notifyUrl: string;
    }
  ) {
    logger.log('Using pattern: payment.paypal.create');
    return await this.paypalService.createPaypalPayment(
      data.userId,
      data.productList,
      data.returnUrl,
      data.cancelUrl,
      data.notifyUrl
    );
  }

  @MessagePattern('payment.paypal.extract')
  async extractPaymentData(@Payload() data: { paymentId: string }) {
    logger.log('Using pattern: payment.paypal.extract');
    return await this.paypalService.getPaymentInfo(data.paymentId);
  }

  @MessagePattern('payment.paypal.execute')
  async executePaypalPayment(
    @Payload() data: { paymentId: string; payerId: string }
  ) {
    logger.log('Using pattern: payment.paypal.execute');
    return await this.paypalService.executePaypalPayment(
      data.paymentId,
      data.payerId
    );
  }

  @MessagePattern('payment.paypal.extract-ipn-body')
  async extractPaypalIPNBody(@Payload() data: any) {
    logger.log('Using pattern: payment.paypal.extract-ipn-body');
    return await this.paypalService.extractPaypalIPNData(data);
  }

  @MessagePattern('payment.paypal.verify-ipn')
  async verifyIpn(data: object) {
    logger.log('Using pattern: payment.paypal.verify-ipn');
    try {
      return await this.paypalService.verifyIpn(data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
