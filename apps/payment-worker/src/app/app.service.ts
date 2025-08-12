import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { QueueService } from './queue/queue.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly queueService: QueueService,
    @Inject('RECEIPT_SERVICE') private readonly receiptClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
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

    try {
      // Step 1: Create receipt
      receipt = await this.createReceipt(data);
      this.logger.log(`Receipt created: ${receipt}`);

      this.logger.log(`Payment processing completed: ${data.transactionId}`);
    } catch (error) {
      this.logger.error(
        `Payment processing failed: ${data.transactionId}`,
        error
      );

      // Initiate refund
      await this.initiateRefund(data, error);

      throw error; // Re-throw so queue service can handle it
    }
  }

  private async createReceipt(data: any): Promise<any> {
    const receiptData = {
      userId: data.userId,
      transactionId: data.transactionId,
      amount: data.amount,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      paymentGateway: data.paymentGateway,
      productList: data.productList,
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

  private async updateUserAccount(data: any, receipt: any): Promise<void> {
    const updateData = {
      userId: data.userId,
      transactionId: data.transactionId,
      productList: data.productList,
      receiptId: receipt.id,
      amount: data.amount,
    };

    this.logger.debug('Update user account?: ', updateData);
    // await firstValueFrom(
    //   this.userClient.send('user.processPayment', updateData).pipe(
    //     timeout(10000),
    //     catchError((error) => {
    //       throw new Error(`User update failed: ${error.message}`);
    //     })
    //   )
    // );
  }

  private async markReceiptAsFailed(
    receiptId: string,
    error: any
  ): Promise<void> {
    try {
      // await firstValueFrom(
      //   this.receiptClient
      //     .send('receipt.markAsFailed', {
      //       receiptId,
      //       error: error instanceof Error ? error.message : String(error),
      //       failedAt: new Date(),
      //     })
      //     .pipe(
      //       timeout(5000),
      //       catchError(() => of(null))
      //     )
      // );

      this.logger.debug('Mark receipt as failed?: ', receiptId, error);
    } catch (err) {
      this.logger.warn('Could not mark receipt as failed:', err);
    }
  }

  private async initiateRefund(data: any, processingError: any): Promise<void> {
    try {
      const refundData = {
        userId: data.userId,
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency,
        reason: 'processing_failed',
        error:
          processingError instanceof Error
            ? processingError.message
            : String(processingError),
      };

      // await firstValueFrom(
      //   this.userClient.send('user.initiateRefund', refundData).pipe(
      //     timeout(10000),
      //     catchError(() => of(null))
      //   )
      // );

      this.logger.log(`Refund initiated for: ${data.transactionId}`);
    } catch (error) {
      this.logger.error('Failed to initiate refund:', error);
    }
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }
}
