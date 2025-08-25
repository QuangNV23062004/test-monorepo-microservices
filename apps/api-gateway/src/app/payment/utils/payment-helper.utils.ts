// utils/payment.utils.ts
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IProductItem } from '@nest-microservices/shared-interfaces';
import { PaymentModeEnum } from '@nest-microservices/shared-enum';

const logger = new Logger('ApiGateway - PaymentUtils');

@Injectable()
export class PaymentHelper {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
  ) {}

  async checkProductList(productList: IProductItem[]) {
    const products = await firstValueFrom(
      this.productClient.send('product.check-product-list', {
        productList: productList,
      })
    );

    return products;
  }

  async handlePaymentRedirect(data: any) {
    try {
      //check the product list to ensure have enough product before proceed
      await this.checkProductList(data.productList);

      //redirect user
      return await firstValueFrom(
        this.paymentClient.send('payment.redirect', { data, success: true })
      );
    } catch (error) {
      logger.error(
        `Error handling payment redirect: ${
          error instanceof Error ? error.message : error
        }`
      );

      return await firstValueFrom(
        this.paymentClient.send('payment.redirect', {
          data: data,
          success: false,
        })
      );
    }
  }

  async sendDataToQueue(data: any) {
    await this.checkProductList(data.productList);
    //send data to queue for worker to handle
    const result = await firstValueFrom(
      this.paymentClient.send('payment.send-data-to-queue', { ...data })
    );
    return result;
  }

  async updateUserBalance(
    userId: string,
    amount: string | number,
    mode: string
  ) {
    await firstValueFrom(
      this.userClient.send('user.update-balance', {
        id: userId,
        amount: Number(amount),
        mode: mode,
      })
    );
  }

  assignPriceToProductList(productList: IProductItem[], products: any[]) {
    return productList.map((p) => {
      const checkP = products.find((product) => product.id === p.productId);
      if (!checkP) {
        throw new HttpException(
          `Product with id ${p.productId} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      return { ...p, currentPrice: checkP.currentPrice || checkP.price };
    });
  }
}
