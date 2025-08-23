import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaypalService } from './paypal.service';
import { IProductItem } from '@nest-microservices/shared-interfaces';

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
    return await this.paypalService.getPaymentInfo(data.paymentId);
  }
}
