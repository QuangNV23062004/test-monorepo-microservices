import { HttpStatus, Injectable } from '@nestjs/common';
import OrderRepository from './repository/order.repository';
import OrderItemRepository from './repository/order-item.repository';
import { IProductItem, IQuery } from '@nest-microservices/shared-interfaces';
import { PrismaService } from './prisma/prisma.service';
import { RoleEnum } from '@nest-microservices/shared-enum';
import { RpcException } from '@nestjs/microservices';
@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository
  ) {}

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
  private checkOwner(userId: string, requesterId: string, role: string) {
    if (userId !== requesterId && role !== RoleEnum.ADMIN) {
      throw new RpcException({
        message: 'Forbidden',
        code: HttpStatus.FORBIDDEN,
        location: 'OrderService',
      });
    }
  }
  getOrder = async (id: string, requesterId: string, role: string) => {
    const order = await this.orderRepository.getById(id, {
      includes: {
        orderItems: true,
      },
    });

    this.checkOwner(order.userId, requesterId, role);
    return order;
  };

  getOrdersWithPaginations = async (query: IQuery) => {
    return this.orderRepository.getAllWithPagination(
      query.page,
      query.size,
      query.search,
      query.searchField,
      query.order,
      query.sortBy,
      {
        ...query.options,
        includes: {
          orderItems: true,
          receipts: true,
        },
      }
    );
  };

  getOrderByUserId = async (
    userId: string,
    requesterId: string,
    role: string,
    query: IQuery
  ) => {
    this.checkOwner(userId, requesterId, role);
    return this.orderRepository.getOrderByUserId(userId, query);
  };

  createOrder = async (
    userId: string,
    amount: string,
    currency: string,
    receiptId: string,
    orderItems: IProductItem[]
  ) => {
    await this.prisma.$transaction(async (tx) => {
      const order = await this.orderRepository.create(
        { userId, amount, currency, receiptId },
        tx as any
      );

      const orderItemsData = orderItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
      }));

      await this.orderItemRepository.createOrderItems(
        orderItemsData,
        tx as any
      );

      return this.orderRepository.getById(order.id, {
        includes: {
          orderItems: true,
        },
      });
    });
  };

  deleteOrder = async (id: string) => {
    await this.prisma.$transaction(async (tx) => {
      await this.orderItemRepository.deleteOrderItems(id, tx as any);
      await this.orderRepository.deleteById(id, tx as any);
    });
  };
}
