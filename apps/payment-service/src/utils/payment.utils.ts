import paypal from '../configs/paypal.config';

import { v4 as uuidv4 } from 'uuid';
import { IPaypalLink } from '../types/IPaypalLink.type';
import { IVNPayParams } from '../types/IVNPayParams.type';
import { vnpayConfig } from '../configs/vnpay.config';
import querystring from 'qs';
import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import moment from 'moment';
import { momoConfig } from '../configs/momo.config';
import { Logger } from '@nestjs/common';
import { IProductItem } from '@nest-microservices/shared-interfaces';

const logger = new Logger('PaymentUtils');
const sortObject = (obj: Record<string, unknown>) => {
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: Record<string, string> = {};
  sortedKeys.forEach((key) => {
    sortedObj[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
  });
  return sortedObj;
};

const createMomoPayment = async (
  amount: number,
  userId: string,
  productList: IProductItem[],
  redirect: string,
  ipn: string
): Promise<string> => {
  const accessKey = momoConfig.accessKey;
  const secretKey = momoConfig.secretKey;
  const orderInfo = 'pay with MoMo';
  const partnerCode = momoConfig.partnerCode;
  const redirectUrl = redirect;
  const ipnUrl = ipn;
  const requestType = 'payWithMethod';
  const orderId = partnerCode + new Date().getTime();
  const requestId = orderId;
  const productListString = JSON.stringify(productList);
  const extraDataObj = {
    userId,
    products: productList,
  };
  const extraData = encodeURIComponent(JSON.stringify(extraDataObj));
  // const paymentCode = momoConfig.paymentCode;
  const orderGroupId = '';
  const autoCapture = true;
  const lang = 'vi';

  const rawSignature =
    'accessKey=' +
    accessKey +
    '&amount=' +
    amount +
    '&extraData=' +
    extraData +
    '&ipnUrl=' +
    ipnUrl +
    '&orderId=' +
    orderId +
    '&orderInfo=' +
    orderInfo +
    '&partnerCode=' +
    partnerCode +
    '&redirectUrl=' +
    redirectUrl +
    '&requestId=' +
    requestId +
    '&requestType=' +
    requestType;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = JSON.stringify({
    partnerCode: partnerCode,
    partnerName: 'Test',
    storeId: 'MomoTestStore',
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    lang: lang,
    requestType: requestType,
    autoCapture: autoCapture,
    extraData: extraData,
    orderGroupId: orderGroupId,
    signature: signature,
  });
  try {
    const response = await axios.post(
      momoConfig.paymentUrl,
      JSON.parse(requestBody),
      {
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
        },
      }
    );

    return response.data.shortLink;
  } catch (error) {
    logger.error(
      `Failed to create momo payment: ${
        error instanceof AxiosError || error instanceof Error
          ? error.message
          : error
      }`
    );

    throw error;
  }
};

const createVnpayPayment = async (
  amount: number,
  userId: string,
  productList: IProductItem[],
  redirect: string,
  ipn: string,
  ipAddr?: string,
  bankCode?: string
): Promise<string> => {
  const productListString = JSON.stringify(productList);
  const createDate = moment(new Date()).format('YYYYMMDDHHmmss');
  let vnp_Params: IVNPayParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: uuidv4(),
    vnp_OrderInfo: `${userId}|${productListString}`,
    vnp_OrderType: 'Membership package',
    vnp_Amount: String(amount * 100),
    vnp_ReturnUrl: redirect,
    vnp_IpAddr: ipAddr as string,
    vnp_CreateDate: createDate,
    vnp_IpnUrl: ipn,
  };

  if (bankCode) {
    vnp_Params['vnp_BankCode'] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params) as IVNPayParams;
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
  vnp_Params['vnp_SecureHash'] = hmac
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  const vnpUrl = `${vnpayConfig.vnp_Url}?${querystring.stringify(vnp_Params, {
    encode: false,
  })}`;
  return vnpUrl;
};

const createPaypalPayment = async (
  amount: number,
  userId: string,
  productList: IProductItem[],
  returnUrl: string,
  cancelUrl: string,
  notifyUrl: string
) => {
  const productListString = JSON.stringify(productList);

  const createPaymentJson = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal',
    },
    redirect_urls: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
    },
    transactions: [
      {
        amount: {
          currency: 'USD',
          total: amount.toFixed(2),
        },
        description: `${userId}|${productListString}`,
      },
    ],
  };

  return new Promise((resolve, reject) => {
    paypal.payment.create(createPaymentJson, (error, payment) => {
      if (error) {
        reject(error);
      } else {
        resolve(payment);
      }
    });
  });
};

export { createMomoPayment, createVnpayPayment, createPaypalPayment };
