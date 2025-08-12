import { Injectable } from '@nestjs/common';
import { createMomoPayment } from '../../utils/payment.utils';
import { IProductItem } from '@nest-microservices/shared-interfaces';
import { RpcException } from '@nestjs/microservices';

const ItemList = [
  {
    productId: '1',
    stockQuantity: 100,
    currentPrice: 100000,
  },
  {
    productId: '2',
    stockQuantity: 100,
    currentPrice: 150000,
  },
  {
    productId: '3',
    stockQuantity: 50,
    currentPrice: 200000,
  },
];

@Injectable()
export class MomoService {
  createMomoPayment = async (
    userId: string,
    productList: IProductItem[],
    redirect: string,
    ipn: string
  ) => {
    let total = 0;

    //fake product, may be product microservices later
    productList.forEach((p) => {
      const item = ItemList.find((i) => i.productId === p.productId);
      if (!item) {
        throw new RpcException({
          code: 400,
          message: 'Product not found',
          location: 'PaymentService',
        });
      }
      if (p.quantity > item.stockQuantity) {
        throw new RpcException({
          code: 400,
          message: 'Insufficient product quantity',
          location: 'PaymentService',
        });
      }
      total += p.quantity * item.currentPrice;
      p.currentPrice = item.currentPrice;
    });

    const url = createMomoPayment(total, userId, productList, redirect, ipn);
    return url;
  };
}
