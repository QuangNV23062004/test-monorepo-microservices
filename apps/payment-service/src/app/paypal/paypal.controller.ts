import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { PaypalService } from './paypal.service';
import { IProductItem } from '@nest-microservices/shared-interfaces';
import { QueueData } from '../../types/IQueueData';

const logger = new Logger('PaymentService - Paypal');
@Controller('paypal')
export class PaypalController {
  constructor(private readonly paypalService: PaypalService) {}

  private handleError(error: unknown, message: string): RpcException {
    logger.error(error);
    if (error instanceof RpcException) {
      throw error;
    } else {
      throw new RpcException({
        code: 500,
        message: `${error instanceof Error ? error.message : message}`,
        location: 'PaymentService - Paypal',
      });
    }
  }

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
  ): Promise<string> {
    logger.log('Using pattern: payment.paypal.create');
    try {
      return await this.paypalService.createPaypalPayment(
        data.userId,
        data.productList,
        data.returnUrl,
        data.cancelUrl,
        data.notifyUrl
      );
    } catch (error) {
      this.handleError(error, 'Failed to create paypal payment');
    }
  }

  @MessagePattern('payment.paypal.extract')
  async extractPaymentData(
    @Payload() data: { paymentId: string }
  ): Promise<object> {
    logger.log('Using pattern: payment.paypal.extract');
    try {
      return await this.paypalService.getPaymentInfo(data.paymentId);
    } catch (error) {
      this.handleError(error, 'Failed to extract paypal query');
    }
  }

  @MessagePattern('payment.paypal.execute')
  async executePaypalPayment(
    @Payload() data: { paymentId: string; payerId: string }
  ): Promise<object> {
    logger.log('Using pattern: payment.paypal.execute');
    try {
      return await this.paypalService.executePaypalPayment(
        data.paymentId,
        data.payerId
      );
    } catch (error) {
      this.handleError(error, 'Failed to execute paypal payment');
    }
  }

  @MessagePattern('payment.paypal.extract-ipn-body')
  async extractPaypalIPNBody(@Payload() data: any): Promise<QueueData> {
    logger.log('Using pattern: payment.paypal.extract-ipn-body');
    try {
      return await this.paypalService.extractPaypalIPNData(data);
    } catch (error) {
      this.handleError(error, 'Failed to extract ipn body');
    }
  }

  @MessagePattern('payment.paypal.verify-ipn')
  async verifyIpn(data: object): Promise<string> {
    logger.log('Using pattern: payment.paypal.verify-ipn');
    try {
      return await this.paypalService.verifyIpn(data);
    } catch (error) {
      this.handleError(error, 'Failed to verify paypal ipn');
    }
  }
}
