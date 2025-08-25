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
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
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
import { PaymentHelper } from './utils/payment-helper.utils';
dotenv.config();

const logger = new Logger('ApiGateway - PaypalController');
@Controller('payment/paypal')
export class PaypalController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private readonly paymentHelper: PaymentHelper
  ) {}

  /*
   * Create payment for paypal
   */
  @Post('create')
  @UseGuards(AuthGuard)
  async createPaypalPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() request: IAuthenticatedRequest
  ) {
    try {
      const userId = request.user?.userId;
      const products = await this.paymentHelper.checkProductList(
        createPaymentDto.productList as IProductItem[]
      );

      const assignedPriceList = this.paymentHelper.assignPriceToProductList(
        createPaymentDto.productList as IProductItem[],
        products
      );

      const returnUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/paypal/execute`;

      const notifyUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/paypal/return`;

      const cancelUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/paypal/canceled`;

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

  /*
   * IPN for paypal
   */
  @Post('return')
  async paypalIpn(@Body() body: any, @Res() res: Response) {
    try {
      const verification = await firstValueFrom(
        this.paymentClient.send('payment.paypal.verify-ipn', { ...body })
      );
      if (verification === 'VERIFIED') {
        //extract from ipn
        const data = await firstValueFrom(
          this.paymentClient.send('payment.paypal.extract-ipn-body', {
            ...body,
          })
        );

        try {
          await this.paymentHelper.checkProductList(data.productList);
          await this.paymentHelper.sendDataToQueue(data);
        } catch (error) {
          //refund
          await this.paymentHelper.updateUserBalance(
            data.userId,
            Math.round(data.amount * data.currentExchangeRate * 100) / 100,
            PaymentModeEnum.REFUND
          );
        }
      } else {
        logger.log('Invalid paypal ipn request');
      }
      return res.status(200).send('OK');
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to process paypal payment');
    }
  }

  /*
   * Redirect url for paypal
   */
  @Get('return')
  async paypalReturn(@Query('paymentId') paymentId: string) {
    try {
      //simple extract from paymentId to create ui
      const data = await firstValueFrom(
        this.paymentClient.send('payment.paypal.extract', {
          paymentId,
        })
      );

      return await this.paymentHelper.handlePaymentRedirect(data);
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to process paypal payment');
    }
  }

  /*
   * Canceled url for paypal
   */
  @Get('canceled')
  async paymentCanceled() {
    return { message: 'Payment canceled' };
  }

  /*
   *Execute the payment paypal
   */
  @Get('execute')
  async executePaypalPayment(@Query() query: any, @Res() res: Response) {
    try {
      const paymentId = query.paymentId;
      const payerId = query.PayerID;

      //execute paypal payment
      const data = await firstValueFrom(
        this.paymentClient.send('payment.paypal.execute', {
          paymentId,
          payerId,
        })
      );

      return res.redirect(
        `${process.env.SERVER_URL}/api/payment/paypal/return?paymentId=${paymentId}`
      );
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to execute paypal payment');
    }
  }
}
