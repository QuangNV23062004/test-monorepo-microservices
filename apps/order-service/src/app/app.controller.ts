import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { IProductItem, IQuery } from '@nest-microservices/shared-interfaces';

const logger = new Logger('OrderService');
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
        location: 'OrderService',
      });
    }
  }
  @MessagePattern('order.get-by-userId')
  async getOrderByUserId(
    @Payload()
    data: {
      userId: string;
      query: IQuery;
      requesterId: string;
      role: string;
    }
  ) {
    logger.log('Using pattern: order.get-by-userId');
    try {
      return this.appService.getOrderByUserId(
        data.userId,
        data.requesterId,
        data.role,
        {
          page: data?.query?.page || 1,
          size: data?.query?.size || 5,
          sortBy: data?.query?.sortBy || 'createdAt',
          order: data?.query?.order || 'desc',
          search: data?.query?.search || '',
          searchField: data?.query?.searchField || '',
        }
      );
    } catch (error) {
      this.handleError(error, 'Failed to get order by userId');
    }
  }

  @MessagePattern('order.get-by-id')
  async getOrder(
    @Payload() data: { id: string; requesterId: string; role: string }
  ) {
    logger.log('Using pattern: order.get-by-id');
    try {
      return this.appService.getOrder(data.id, data.requesterId, data.role);
    } catch (error) {
      this.handleError(error, 'Failed to get order by id');
    }
  }

  @MessagePattern('order.get-all-with-pagination')
  async getOrders(@Payload() data: { query: IQuery }) {
    logger.log('Using pattern: order.get-all-with-pagination');
    try {
      return await this.appService.getOrdersWithPaginations({
        page: data?.query?.page || 1,
        size: data?.query?.size || 5,
        sortBy: data?.query?.sortBy || 'createdAt',
        order: data?.query?.order || 'desc',
        search: data?.query?.search || '',
        searchField: data?.query?.searchField || '',
      });
    } catch (error) {
      this.handleError(error, 'Failed to get all order');
    }
  }

  @MessagePattern('order.create')
  async createOrder(
    @Payload()
    data: {
      userId: string;
      amount: string;
      currency: string;
      receiptId: string;
      orderItem: IProductItem[];
    }
  ) {
    logger.log('Using pattern: order.create');
    logger.log('Order data received:', JSON.stringify(data, null, 2));

    try {
      const result = await this.appService.createOrder(
        data.userId,
        data.amount,
        data.currency || 'VND',
        data.receiptId,
        data.orderItem
      );

      logger.log(
        'Order created successfully:',
        JSON.stringify(result, null, 2)
      );
      return result;
    } catch (error) {
      logger.error('Error creating order:', error);
      this.handleError(error, 'Failed to create order');
    }
  }

  @MessagePattern('order.delete')
  async deleteOrder(@Payload() data: { orderId: string }) {
    logger.log('Using pattern: order.delete');
    try {
      return await this.appService.deleteOrder(data.orderId);
    } catch (error) {
      this.handleError(error, 'Failed to delete order');
    }
  }
}
