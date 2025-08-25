import { Inject, Injectable } from '@nestjs/common';
import {
  createMomoPayment,
  verifyMomoIpnSignature,
} from '../../utils/payment.utils';
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

  verifyMomoSignature = async (data: any, redirect: string, ipn: string) => {
    return await verifyMomoIpnSignature(data, redirect, ipn);
  };

  extractIpnBody = async (data: any) => {
    const extraData = JSON.parse(data.extraData);
    const userId = extraData.userId;
    const amount = data.amount;
    const currency = 'VND';
    const currentExchangeRate = 1;
    const transactionId = data.transId;
    const paymentMethod = data.payType;
    const productList = extraData.products;
    const result = {
      userId,
      amount,
      currency,
      currentExchangeRate,
      transactionId,
      paymentMethod,
      paymentGateway: 'PayPal',
      productList,
    };
    return result;
  };
}
