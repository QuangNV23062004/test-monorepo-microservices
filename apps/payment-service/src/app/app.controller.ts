import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';

const logger = new Logger('PaymentService');
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
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
  paymentRedirect(@Payload() data: { data: object; success: boolean }) {
    logger.log('Using pattern: payment.redirect');
    try {
      return this.appService.handlePlaymentProcess(data.data, data.success);
    } catch (error) {
      this.handleError(error, 'Failed to redirect payment');
    }
  }
}
