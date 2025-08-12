import { Injectable } from '@nestjs/common';
import {
  BaseRepository,
  IPrismaService,
} from '@nest-microservices/shared-repository';
import { Prisma, ReceiptItem } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReceiptItemRepository extends BaseRepository<ReceiptItem> {
  constructor(prisma: PrismaService) {
    super(prisma, 'receiptItem');
  }

  async createReceiptItems(
    data: Prisma.ReceiptItemCreateManyInput[],
    tx?: IPrismaService
  ) {
    const model = this.getModel(tx);
    return await model.createMany({ data });
  }
}
