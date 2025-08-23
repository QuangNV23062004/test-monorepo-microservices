import {
  Injectable,
  OnModuleInit,
  Logger,
  Inject,
  HttpStatus,
} from '@nestjs/common';
import { QueueService } from './queue/queue.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { Receipt } from '@prisma/client';
import { PaymentModeEnum } from '@nest-microservices/shared-enum';
import { IProductItem } from '@nest-microservices/shared-interfaces';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger('PaymentWorker');

  constructor(
    private readonly queueService: QueueService,
    @Inject('RECEIPT_SERVICE') private readonly receiptClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy
  ) {}

  async getData() {
    return { data: 'data' };
  }

  async onModuleInit() {
    this.logger.log('Starting payment worker...');
    // Start listening to the queue
    this.startQueueListener();
  }

  private startQueueListener() {
    this.logger.log('🔍 Initializing queue listener...');
    this.queueService.consumePaymentData((data) => {
      this.logger.log(`📥 Received work item: ${data.transactionId}`);
      return this.processPayment(data);
    });
  }

  // Main payment processing logic
  async processPayment(data: any): Promise<void> {
    this.logger.log(`Processing payment: ${data.transactionId}`);

    let receipt = null;
    let order = null;
    let product = null;
    try {
      // Step 1: Create receipt
      receipt = await this.createReceipt(
        data.userId,
        data.transactionId,
        data.amount,
        data.currency,
        data.paymentMethod,
        data.paymentGateway,
        data.productList
      );
      this.logger.debug(`Receipt created: ${receipt.id}`);

      //Step 2: Create order
      order = await this.createOrder(
        data.userId,
        data.amount,
        data.currency,
        data.productList,
        receipt.id
      );
      this.logger.debug(`Order created: ${order.id}`);

      //Step 3: Update product quantity
      product = await this.updateProductQuantity(
        data.productList,
        PaymentModeEnum.CHECKOUT
      );
      this.logger.debug(`Products updated: ${product}`);

      this.logger.log(`Payment processing completed: ${data.transactionId}`);
    } catch (error) {
      if (receipt) this.deleteReceipt(receipt.id);

      if (order) this.deleteOrder(order.id);

      if (product)
        this.updateProductQuantity(data.productList, PaymentModeEnum.REFUND);

      this.logger.error(
        `Payment processing failed: ${data.transactionId}`,
        error
      );
      // Calculate refund amount in VND (convert from USD to VND) if needed
      const refundAmount =
        Math.round(data.amount * data.currentExchangeRate * 100) / 100;
      // Initiate refund
      await this.refundUser(data.userId, refundAmount);

      throw error; // Re-throw so queue service can handle it
    }
  }

  private async updateProductQuantity(
    productList: IProductItem[],
    mode: string
  ) {
    return await firstValueFrom(
      this.productClient.send('product.update-quantity', { productList, mode })
    );
  }

  private async createReceipt(
    userId: string,
    transactionId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    paymentGateway: string,
    productList: IProductItem[]
  ): Promise<Receipt> {
    const receiptData = {
      userId: userId,
      transactionId: transactionId,
      amount: amount,
      currency: currency,
      paymentMethod: paymentMethod,
      paymentGateway: paymentGateway,
      productList: productList,
      status: 'completed',
      createdAt: new Date(),
    };

    return await firstValueFrom(
      this.receiptClient.send('receipt.create', receiptData).pipe(
        timeout(10000),
        catchError((error) => {
          throw new Error(`Receipt creation failed: ${error.message}`);
        })
      )
    );
  }

  private async refundUser(id: string, amount: number) {
    try {
      await firstValueFrom(
        this.userClient.send('user.update-balance', {
          id,
          amount,
          mode: PaymentModeEnum.REFUND,
        })
      );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async deleteReceipt(receiptId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.receiptClient.send('receipt.delete', {
          receiptId,
        })
      );

      this.logger.debug('Deleted receipt:', receiptId);
    } catch (err) {
      this.logger.warn('Could not delete receipt: ', err);
    }
  }

  private async createOrder(
    userId: string,
    amount: number,
    currency: string,
    orderItem: IProductItem[],
    receiptId: string
  ) {
    const orderData = {
      userId: userId,
      amount: amount.toString(), // Convert to string
      currency: currency,
      receiptId,
      orderItem: orderItem,
    };

    return await firstValueFrom(
      this.orderClient.send('order.create', orderData).pipe(
        timeout(10000),
        catchError((error) => {
          throw new Error(`Order creation failed: ${error.message}`);
        })
      )
    );
  }

  private async deleteOrder(orderId: string) {
    try {
      await firstValueFrom(this.orderClient.send('order.delete', { orderId }));
      this.logger.debug('Deleted order:', orderId);
    } catch (err) {
      this.logger.warn('Could not delete order: ', err);
    }
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
