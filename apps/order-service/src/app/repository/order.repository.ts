import { IQuery } from '@nest-microservices/shared-interfaces';
import { BaseRepository } from '@nest-microservices/shared-repository';
import { Injectable } from '@nestjs/common';
import { Order } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export default class OrderRepository extends BaseRepository<Order> {
  constructor(prisma: PrismaService) {
    super(prisma, 'order');
  }

  async getOrderByUserId(userId: string, query: IQuery) {
    return this.getModel().findMany({
      where: {
        userId,
      },
      take: query.size,
      skip: (query.page - 1) * query.size,
      orderBy: { [query.sortBy]: query.order },
      include: {
        orderItems: true,
        receipts: true,
      },
    });
  }
}
