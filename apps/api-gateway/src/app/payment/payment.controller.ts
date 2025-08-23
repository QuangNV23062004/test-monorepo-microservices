import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
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
import { PaymentModeEnum } from '@nest-microservices/shared-enum';
dotenv.config();

const logger = new Logger('ApiGateway - PaymentController');
@Controller('payment')
export class PaymentController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
  ) {}

  private async checkProductList(productList: IProductItem[]) {
    const products = await firstValueFrom(
      this.productClient.send('product.check-product-list', {
        productList: productList,
      })
    );

    return products;
  }

  private async handlePaymentRedirect(data: any) {
    try {
      await this.checkProductList(data.productList);
      return await firstValueFrom(
        this.paymentClient.send('payment.redirect', { data, success: true })
      );
    } catch (error) {
      logger.error(
        `Error handling payment redirect: ${
          error instanceof Error ? error.message : error
        }`
      );
      await firstValueFrom(
        this.userClient.send('user.update-balance', {
          id: data.userId,
          amount: Number(data.amount),
          mode: PaymentModeEnum.REFUND,
        })
      );
      return await firstValueFrom(
        this.paymentClient.send('payment.redirect', {
          data: data,
          success: false,
        })
      );
    }
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

      const products = await this.checkProductList(
        createPaymentDto.productList as IProductItem[]
      );

      const assignedPriceList = createPaymentDto.productList.map((p) => {
        const checkP = products.find((product) => product.id === p.productId);
        if (!checkP) {
          throw new HttpException(
            `Product with id ${p.productId} not found`,
            HttpStatus.NOT_FOUND
          );
        }
        return { ...p, currentPrice: checkP.currentPrice || checkP.price };
      });

      const redirectUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/momo/return`;

      const ipnUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/success`;

      const url = await firstValueFrom(
        this.paymentClient.send('payment.momo.create', {
          userId,
          productList: assignedPriceList,
          redirect: redirectUrl,
          ipn: ipnUrl,
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

      return await this.handlePaymentRedirect(data);
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to capture momo payment');
    }
  }

  @Post('paypal/create')
  @UseGuards(AuthGuard)
  async createPaypalPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() request: IAuthenticatedRequest
  ) {
    try {
      const userId = request.user?.userId;
      const products = await this.checkProductList(
        createPaymentDto.productList as IProductItem[]
      );

      const assignedPriceList = createPaymentDto.productList.map((p) => {
        const checkP = products.find((product) => product.id === p.productId);
        if (!checkP) {
          throw new HttpException(
            `Product with id ${p.productId} not found`,
            HttpStatus.NOT_FOUND
          );
        }
        return { ...p, currentPrice: checkP.currentPrice || checkP.price };
      });

      const returnUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/paypal/return`;

      const notifyUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/success`;

      const cancelUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/canceled`;

      const url = await firstValueFrom(
        this.paymentClient.send('payment.paypal.create', {
          userId,
          productList: assignedPriceList,
          returnUrl,
          cancelUrl,
          notifyUrl,
        })
      );

      return { url, message: 'Successfully create paypal payment' };
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to create paypal payment');
    }
  }

  @Get('paypal/return')
  async paypalReturn(@Query('paymentId') paymentId: string) {
    try {
      const data = await firstValueFrom(
        this.paymentClient.send('payment.paypal.extract', {
          paymentId,
        })
      );

      return await this.handlePaymentRedirect(data);
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to process paypal payment');
    }
  }

  @Get('/canceled')
  async paymentCanceled() {
    return { message: 'Payment canceled' };
  }
}
