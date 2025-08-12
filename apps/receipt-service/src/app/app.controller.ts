import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { IProductItem, IQuery } from '@nest-microservices/shared-interfaces';

const logger = new Logger('ReceiptService');

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
        location: 'ReceiptService',
      });
    }
  }

  @Get()
  getData() {
    return this.appService.getData();
  }

  @MessagePattern('receipt.all')
  async getAllReceipt() {
    logger.log('Using pattern: receipt.all');
    try {
      return this.appService.getReceipts();
    } catch (error) {
      this.handleError(error, 'Failed to get all receipt');
    }
  }

  @MessagePattern('receipt.all-with-pagination')
  async getAllReceiptWithPagination(@Payload() query: IQuery) {
    logger.log('Using pattern: receipt.all-with-pagination');
    try {
      return this.appService.getAllReceiptWithPagination({
        page: query.page || 1,
        size: query.size || 5,
        search: query.search || '',
        searchField: query.searchField || '',
        order: query.order || 'desc',
        sortBy: query.sortBy || 'createdAt',
      });
    } catch (error) {
      this.handleError(error, 'Failed to get receipts with pagination');
    }
  }

  @MessagePattern('receipt.get-receipt')
  async getReceipt(@Payload() data: { id: string }) {
    logger.log('Using pattern: receipt.get-receipt');
    try {
      return this.appService.getReceipt(data.id);
    } catch (error) {
      this.handleError(error, 'Failed to get receipt');
    }
  }

  @MessagePattern('receipt.create')
  async createReceipt(
    @Payload()
    data: {
      userId: string;
      amount: number;
      currency: string;
      currencyExchangeRate: number;
      transactionId: string;
      paymentMethod: string;
      paymentGateway: string;
      productList: IProductItem[];
    }
  ) {
    logger.log('Using pattern: receipt.create');
    try {
      return this.appService.createReceipt(
        data.userId,
        data.amount,
        data.currency || 'VND',
        data.currencyExchangeRate || 1,
        data.transactionId,
        data.paymentMethod,
        data.paymentGateway,
        data.productList
      );
    } catch (error) {
      this.handleError(error, 'Failed to create receipt');
    }
  }
}
