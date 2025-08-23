import { Controller, Inject, Logger } from '@nestjs/common';
import {
  ClientProxy,
  MessagePattern,
  Payload,
  RpcException,
} from '@nestjs/microservices';
import { MomoService } from './momo.service';
import { IProductItem } from '@nest-microservices/shared-interfaces';
import { IMomoQuery } from '../../types/IMomoQuery';

const logger = new Logger('PaymentService - Momo');
@Controller('momo')
export class MomoController {
  constructor(private readonly momoService: MomoService) {}

  private handleError(error: unknown, message: string) {
    logger.error(error);
    if (error instanceof RpcException) {
      throw error;
    } else {
      throw new RpcException({
        code: 500,
        message: `${error instanceof Error ? error.message : message}`,
        location: 'PaymentService - Momo',
      });
    }
  }
  @MessagePattern('payment.momo.create')
  async createMomoPayment(
    @Payload()
    data: {
      userId: string;
      productList: IProductItem[];
      redirect: string;
      ipn: string;
    }
  ) {
    logger.log('Using pattern: payment.momo.create');

    try {
      return this.momoService.createMomoPayment(
        data.userId,
        data.productList,
        data.redirect,
        data.ipn
      );
    } catch (error) {
      this.handleError(error, 'Failed to create momo payment');
    }
  }

  @MessagePattern('payment.momo.extract')
  async extractMomoData(data: IMomoQuery) {
    logger.log('Using pattern: payment.momo.extract');
    try {
      const { amount, transId, payType, extraData } = data;

      try {
        // Decode extraData (it's double URL-encoded)
        const decoded = decodeURIComponent(decodeURIComponent(extraData));
        const extraDataObj = JSON.parse(decoded);

        const { userId, products } = extraDataObj;

        // Map to Receipt
        const queueData = {
          userId,
          amount: Number(amount),
          currency: 'VND',
          currentExchangeRate: 1,
          transactionId: transId,
          paymentMethod: payType,
          paymentGateway: 'MoMo',
          productList: products,
        };

        return queueData;
      } catch (error) {
        console.error('Error processing MoMo return:', error);
        return {
          message: 'Error processing payment return',
          error: error.message,
          extraData: extraData,
        };
      }
    } catch (error) {
      this.handleError(error, 'Failed to extract momo payment');
    }
  }
}
