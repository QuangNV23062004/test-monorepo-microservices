import { Injectable } from '@nestjs/common';
import {
  createPaypalPayment,
  getPaypalPaymentInfo,
} from '../../utils/payment.utils';
import { IProductItem } from '@nest-microservices/shared-interfaces';
import axios from 'axios';

@Injectable()
export class PaypalService {
  createPaypalPayment = async (
    userId: string,
    productList: IProductItem[],
    returnUrl: string,
    cancelUrl: string,
    notifyUrl: string
  ) => {
    let total = 0;

    productList.map((p) => {
      total += p.quantity * p.currentPrice;
    });

    const exchangeData: any = await axios.get(
      `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_KEY}/latest/USD`
    );
    const exchangeRate =
      Number(exchangeData?.data?.conversion_rates?.VND) || 25000;

    total = Math.round((total / exchangeRate) * 100) / 100;

    const url = await createPaypalPayment(
      total,
      userId,
      productList,
      returnUrl,
      cancelUrl,
      notifyUrl,
      exchangeRate
    );

    return url;
  };

  getPaymentInfo = async (paymentId: string) => {
    try {
      // Fetch payment info from PayPal API
      const info: any = await getPaypalPaymentInfo(paymentId);
      const paymentData = info;

      // Validate payment data structure
      if (
        !paymentData ||
        !paymentData.transactions ||
        !paymentData.transactions[0]
      ) {
        throw new Error('Invalid payment data structure from PayPal');
      }

      const transaction = paymentData.transactions[0];

      let custom;
      try {
        custom = JSON.parse(transaction.custom);
      } catch (error) {
        throw new Error(`Failed to parse custom field: ${error.message}`);
      }

      // Extract relevant fields
      const userId = custom.userId;
      const productList = custom.products;
      const amount = Number(transaction.amount.total);
      const currency = transaction.amount.currency;
      const transactionId = paymentData.id;
      const paymentMethod = paymentData.payer.payment_method;
      const currentExchangeRate = Number(custom.exchangeRate);

      // Transform to desired format
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
    } catch (error) {
      throw new Error(`Failed to get payment info: ${error.message}`);
    }
  };
}
