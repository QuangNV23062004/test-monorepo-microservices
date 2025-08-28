import { IProductItem } from '@nest-microservices/shared-interfaces';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { VnpayService } from './vnpay.service';
import { QueueData } from '../../types/IQueueData';

const logger = new Logger('PaymentService - VNPay');
@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

  private handleError(error: unknown, message: string) {
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

  @MessagePattern('payment.vnpay.create')
  async createVnpayPayment(
    @Payload()
    data: {
      userId: string;
      productList: IProductItem[];
      redirect: string;
      ipn: string;
      ipAddr?: string;
    }
  ): Promise<string> {
    logger.log('Using pattern: payment.vnpay.create');
    try {
      return await this.vnpayService.createVNPayPayment(
        data.userId,
        data.productList,
        data.redirect,
        data.ipn,
        data.ipAddr
      );
    } catch (error) {
      this.handleError(error, 'Failed to create vnpay payment');
    }
  }

  @MessagePattern('payment.vnpay.extract')
  async extractVnpayQuery(@Payload() data: any): Promise<QueueData> {
    logger.log('Using pattern: payment.vnpay.extract');
    try {
      return await this.vnpayService.extractVnpayQuery(data);
    } catch (error) {
      this.handleError(error, 'Failed to extract vnpay query');
    }
  }

  @MessagePattern('payment.vnpay.verify-ipn')
  async verifyVnpayIpn(@Payload() data: any): Promise<boolean> {
    logger.log('Using pattern: payment.vnpay.verify-ipn');
    try {
      return await this.vnpayService.verifyVnpaySecureHash(data);
    } catch (error) {
      this.handleError(error, 'Failed verify vnpay payment');
    }
  }
}
