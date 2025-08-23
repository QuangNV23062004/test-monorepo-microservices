import { Inject, Injectable } from '@nestjs/common';
import { createMomoPayment } from '../../utils/payment.utils';
import { IProductItem } from '@nest-microservices/shared-interfaces';
import { ClientProxy, RpcException } from '@nestjs/microservices';

@Injectable()
export class MomoService {
  createMomoPayment = async (
    userId: string,
    productList: IProductItem[],
    redirect: string,
    ipn: string
  ) => {
    let total = 0;

    productList.map((p) => {
      total += p.quantity * p.currentPrice;
    });

    const url = createMomoPayment(total, userId, productList, redirect, ipn);
    return url;
  };
}
