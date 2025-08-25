import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { QueueService } from './queue/queue.service';

const logger = new Logger('PaymentService');
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly queueService: QueueService
  ) {}

  private handleError(error: unknown, message: string) {
    logger.error(error);
    if (error instanceof RpcException) {
      throw error;
    } else {
      throw new RpcException({
        code: 500,
        message: `${error instanceof Error ? error.message : message}`,
        location: 'PaymentService',
      });
    }
  }

  @Get()
  getData() {
    return this.appService.getData();
  }

  @MessagePattern('payment.ipn')
  getIpnTemplate() {
    logger.log('Using pattern: payment.ipn');
    try {
      return this.appService.getIpnTemplate();
    } catch (error) {
      this.handleError(error, 'Failed to load ipn page');
    }
  }

  @MessagePattern('payment.redirect')
  async paymentRedirect(@Payload() data: { data: object; success: boolean }) {
    logger.log('Using pattern: payment.redirect');
    try {
      return await this.appService.paymentRedirect(data.data, data.success);
    } catch (error) {
      this.handleError(error, 'Failed to redirect payment');
    }
  }

  @MessagePattern('payment.send-data-to-queue')
  async sendDataToQueue(data: object) {
    logger.log('Using pattern: payment.send-data-to-queue');
    try {
      await this.queueService.sendDataToQueue(data);
      return true;
    } catch (error) {
      this.handleError(error, 'Failed to send data to queue');
    }
  }
}
