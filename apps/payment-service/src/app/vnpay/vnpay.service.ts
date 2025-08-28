import { Injectable } from '@nestjs/common';
import {
  createVnpayPayment,
  decodeVnpayQuery,
  verifyVNPaySecureHash,
} from '../../utils/payment.utils';
import { IProductItem } from '@nest-microservices/shared-interfaces';
import { QueueData } from '../../types/IQueueData';

@Injectable()
export class VnpayService {
  createVNPayPayment = async (
    userId: string,
    productList: IProductItem[],
    redirect: string,
    ipn: string,
    ipAddr: string
  ): Promise<string> => {
    let total = 0;

    productList.map((p) => {
      total += p.quantity * p.currentPrice;
    });

    return await createVnpayPayment(
      total,
      userId,
      productList,
      redirect,
      ipn,
      ipAddr
    );
  };

  extractVnpayQuery = async (data: any): Promise<QueueData> => {
    const decodedData = decodeVnpayQuery(data);
    const orderInfo: any = JSON.parse(decodedData.vnp_OrderInfo);
    const queueData = {
      userId: orderInfo.userId,
      amount: Number(decodedData.vnp_Amount) / 100,
      currency: 'VND',
      currentExchangeRate: 1,
      transactionId: decodedData.vnp_TxnRef,
      paymentMethod: decodedData.vnp_CardType,
      paymentGateway: 'VNPay',
      productList: orderInfo.productList,
    };
    return queueData;
  };

  verifyVnpaySecureHash = async (data): Promise<boolean> => {
    return await verifyVNPaySecureHash(data);
  };
}
