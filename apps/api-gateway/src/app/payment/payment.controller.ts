import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { AuthGuard } from '@nest-microservices/shared-guards';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { errorHandler } from '../../utils/error-handler';
import {
  IAuthenticatedRequest,
  IProductItem,
} from '@nest-microservices/shared-interfaces';
import dotenv from 'dotenv';
dotenv.config();
@Controller('payment')
export class PaymentController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy
  ) {}

  private async checkProductList(productList: IProductItem[]) {
    await firstValueFrom(
      this.productClient.send('product.check-product-list', {
        productList: productList,
      })
    );
  }

  @Get('success')
  async renderSuccessPayment() {
    try {
      //test ipn, cant test locally because server could not be reach by momo/vnpay/paypal
      return await firstValueFrom(this.paymentClient.send('payment.ipn', {}));
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to render ipn template');
    }
  }

  @Post('momo/create')
  @UseGuards(AuthGuard)
  async createMomoPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() request: IAuthenticatedRequest
  ) {
    try {
      const userId = request.user?.userId;

      await this.checkProductList(
        createPaymentDto.productList as IProductItem[]
      );

      const url = await firstValueFrom(
        this.paymentClient.send('payment.momo.create', {
          userId,
          productList: [...createPaymentDto.productList],
          redirect: `${
            process.env.SERVER_URL || 'http://localhost:3000'
          }/api/payment/momo/return`,
          ipn: `${
            process.env.SERVER_URL || 'http://localhost:3000'
          }/api/payment/success`,
        })
      );
      return { url: url, message: 'Successfully created momo payment url' };
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to create momo payment');
    }
  }

  @Get('momo/return')
  async momoReturn(@Query() query: any) {
    try {
      const data = await firstValueFrom(
        this.paymentClient.send('payment.momo.extract', query)
      );

      return await firstValueFrom(
        this.paymentClient.send('payment.redirect', data)
      );
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to capture momo payment');
    }
  }
}
