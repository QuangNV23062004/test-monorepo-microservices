import { HttpStatus, Injectable } from '@nestjs/common';
import OrderRepository from './repository/order.repository';
import OrderItemRepository from './repository/order-item.repository';
import {
  IPaginatedResponse,
  IProductItem,
  IQuery,
} from '@nest-microservices/shared-interfaces';
import { PrismaService } from './prisma/prisma.service';
import { RoleEnum } from '@nest-microservices/shared-enum';
import { RpcException } from '@nestjs/microservices';
import { Order } from '@prisma/client';
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
  getOrder = async (
    id: string,
    requesterId: string,
    role: string
  ): Promise<Order> => {
    const order = await this.orderRepository.getById(id, {
      include: {
        orderItems: true,
        User: true,
        Receipt: {
          include: {
            receiptItems: true,
          },
        },
      },
    });

    this.checkOwner(order.userId, requesterId, role);
    return order;
  };

  getOrdersWithPaginations = async (
    query: IQuery
  ): Promise<IPaginatedResponse> => {
    return this.orderRepository.getAllWithPagination(
      query.page,
      query.size,
      query.search,
      query.searchField,
      query.order,
      query.sortBy,
      {
        ...query.options,
        include: {
          User: true,
          orderItems: true,
          Receipt: {
            include: {
              receiptItems: true,
            },
          },
        },
      }
    );
  };

  getOrdersByUserId = async (
    userId: string,
    requesterId: string,
    role: string,
    query: IQuery
  ): Promise<IPaginatedResponse> => {
    this.checkOwner(userId, requesterId, role);
    return this.orderRepository.getOrdersByUserId(userId, query);
  };

  createOrder = async (
    userId: string,
    amount: string,
    currency: string,
    receiptId: string,
    orderItems: IProductItem[]
  ): Promise<Order> => {
    // console.log('Creating order with data:', {
    //   userId,
    //   amount,
    //   currency,
    //   receiptId,
    //   orderItems,
    // });

    return await this.prisma.$transaction(async (tx) => {
      // console.log('Starting transaction...');

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
      // console.log('Order items created');

      const result = await this.orderRepository.getById(
        order.id,
        {
          include: {
            User: true,
            orderItems: true,
            Receipt: {
              include: {
                receiptItems: true,
              },
            },
          },
        },
        tx as any
      );
      // console.log('Final result:', result);
      return result;
    });
  };

  deleteOrder = async (id: string): Promise<boolean> => {
    return await this.prisma.$transaction(async (tx) => {
      await this.orderItemRepository.deleteOrderItems(id, tx as any);
      await this.orderRepository.deleteById(id, tx as any);
      return true;
    });
  };
}
