import {
  BaseRepository,
  IPrismaService,
} from '@nest-microservices/shared-repository';
import { Injectable } from '@nestjs/common';
import { OrderItem, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export default class OrderItemRepository extends BaseRepository<OrderItem> {
  constructor(prisma: PrismaService) {
    super(prisma, 'orderItem');
  }
  async createOrderItems(
    data: Prisma.OrderItemCreateManyInput[],
    tx?: IPrismaService
  ) {
    const model = this.getModel(tx);
    return await model.createMany({ data });
  }

  async deleteOrderItems(orderId: string, tx?: IPrismaService) {
    const model = this.getModel(tx);
    return model.updateMany({
      where: {
        orderId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
      },
    });
  }
}
