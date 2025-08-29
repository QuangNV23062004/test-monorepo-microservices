import {
  IPaginatedResponse,
  IQuery,
} from '@nest-microservices/shared-interfaces';
import { BaseRepository } from '@nest-microservices/shared-repository';
import { Injectable } from '@nestjs/common';
import { Order } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export default class OrderRepository extends BaseRepository<Order> {
  constructor(prisma: PrismaService) {
    super(prisma, 'order');
  }

  async getOrdersByUserId(
    userId: string,
    query: IQuery
  ): Promise<IPaginatedResponse> {
    const orders = await this.getModel().findMany({
      where: {
        userId,
        isDeleted: false,
      },
      take: query.size,
      skip: (query.page - 1) * query.size,
      orderBy: { [query.sortBy]: query.order },
      include: {
        User: true,
        orderItems: true,
        Receipt: {
          include: {
            receiptItems: true,
          },
        },
      },
    });

    const total = await this.getModel().count({
      where: {
        userId,
        isDeleted: false,
      },
    });

    return {
      data: orders,
      page: query.page,
      size: query.size,
      totalPage: Math.ceil(total / query.size),
      total: total,
    };
  }
}
