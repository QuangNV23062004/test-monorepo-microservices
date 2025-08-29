import { IProductItem } from '@nest-microservices/shared-interfaces';

export interface QueueData {
  userId: string;
  amount: number;
  currency: string;
  currentExchangeRate: number;
  transactionId: string;
  paymentMethod: string;
  paymentGateway: string;
  productList: IProductItem[];
}
