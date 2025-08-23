import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@nest-microservices/shared-repository';
import { Receipt } from '@prisma/client';
import {
  IPaginatedResponse,
  IQuery,
} from '@nest-microservices/shared-interfaces';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReceiptRepository extends BaseRepository<Receipt> {
  constructor(prisma: PrismaService) {
    super(prisma, 'receipt');
  }

  async getReceiptsByUserId(
    userId: string,
    query: IQuery
  ): Promise<IPaginatedResponse> {
    const skip = (query.page - 1) * query.size;
    const whereClause: any = {
      isDeleted: false,
      userId: userId,
    };

    if (query.search && query.searchField) {
      whereClause[query.searchField] = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const sendQuery: any = {
      take: query.size,
      skip: skip,
      where: whereClause,
      include: {
        receiptItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    };

    if (query.sortBy && query.order) {
      sendQuery.orderBy = {
        [query.sortBy]: query.order,
      };
    }

    try {
      const [data, total] = await Promise.all([
        this.model.findMany(sendQuery), // Use inherited model from BaseRepository
        this.model.count({ where: whereClause }),
      ]);

      const totalPage = Math.ceil(total / query.size);

      return {
        data,
        page: query.page,
        size: query.size,
        totalPage,
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get receipts by userId: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }
}
