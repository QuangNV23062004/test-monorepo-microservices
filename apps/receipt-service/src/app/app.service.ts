import { HttpStatus, Injectable } from '@nestjs/common';
import { ReceiptRepository } from './repository/receipt.repository';
import { IProductItem, IQuery } from '@nest-microservices/shared-interfaces';
import { ReceiptItemRepository } from './repository/receipt-item.repository';
import { PrismaService } from './prisma/prisma.service';
import { RpcException } from '@nestjs/microservices';
import { RoleEnum } from '@nest-microservices/shared-enum';
@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptRepository: ReceiptRepository,
    private readonly receiptItemRepository: ReceiptItemRepository
  ) {}

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
  private checkUser = (userId: string, requesterId: string, role: string) => {
    if (userId !== requesterId && role !== RoleEnum.ADMIN) {
      throw new RpcException({
        code: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
        location: 'ReceiptService',
      });
    }
  };

  getReceipts = async () => {
    return await this.receiptRepository.getAll({
      include: {
        receiptItems: {
          where: {
            isDeleted: false, // Filter out deleted receipt items
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        user: {
          // Changed from 'users' to 'user' (singular)
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  };

  getReceiptsByUserId = async (
    userId: string,
    query: IQuery,
    requesterId: string,
    role: string
  ) => {
    this.checkUser(userId, requesterId, role);
    return await this.receiptRepository.getReceiptsByUserId(userId, query);
  };

  getAllReceiptWithPagination = async (query: IQuery) => {
    return await this.receiptRepository.getAllWithPagination(
      query.page,
      query.size,
      query.search,
      query.searchField,
      query.order,
      query.sortBy,
      {
        ...query.options,
        include: {
          receiptItems: {
            where: {
              isDeleted: false,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }
    );
  };

  getReceipt = async (id: string, requesterId: string, role: string) => {
    const receipt = await this.receiptRepository.getById(id, {
      include: {
        receiptItems: {
          where: {
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    this.checkUser(receipt.userId, requesterId, role);
    return receipt;
  };

  createReceipt = async (
    userId: string,
    amount: number,
    currency: string,
    currentExchangeRate: number,
    transactionId: string,
    paymentMethod: string,
    paymentGateway: string,
    receiptItemList: IProductItem[]
  ) => {
    return this.prisma.$transaction(async (tx) => {
      // Create the receipt
      const receipt = await this.receiptRepository.create(
        {
          userId,
          amount,
          currency,
          currentExchangeRate,
          transactionId,
          paymentMethod,
          paymentGateway,
        },
        tx as any
      );

      // console.log('receipt created');
      // Prepare receipt items data
      const receiptItems = receiptItemList.map((r) => ({
        receiptId: receipt.id,
        productId: r.productId,
        quantity: r.quantity,
        pricePerUnit: r.currentPrice,
        isDeleted: false,
      }));

      // console.log('receipt-item created');
      // Create receipt items within the transaction
      await this.receiptItemRepository.createReceiptItems(
        receiptItems,
        tx as any
      );

      // console.log(receipt.id);
      // Return the created receipt with its items
      const processedReceipt = await this.receiptRepository.getById(
        receipt.id,
        {
          include: {
            receiptItems: {
              where: {
                isDeleted: false,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tx as any
      );

      // console.log(processedReceipt);
      return processedReceipt;
    });
  };

  deleteReceipt = async (receiptId: string) => {
    return this.prisma.$transaction(async (tx) => {
      await this.receiptRepository.deleteById(receiptId);
      await this.receiptItemRepository.deleteReceiptItems(receiptId);
      return true;
    });
  };
}
