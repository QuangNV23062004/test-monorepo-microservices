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
@Controller('payment/momo')
export class MomoController {
  constructor(
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private readonly paymentHelper: PaymentHelper
  ) {}

  @Post('create')
  @UseGuards(AuthGuard)
  async createMomoPayment(
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

      const redirectUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/momo/return`;

      const ipnUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/momo/return`;

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

  /*
   *IPN for momo: TO-DO
   */
  @Post('return')
  async momoIpn(@Body() body: any, @Res() res: Response) {
    const redirectUrl = `${
      process.env.SERVER_URL || 'http://localhost:3000'
    }/api/payment/momo/return`;

    const ipnUrl = `${
      process.env.SERVER_URL || 'http://localhost:3000'
    }/api/payment/momo/return`;
    const result = await firstValueFrom(
      this.paymentClient.send('payment.momo.verify-ipn', {
        data: body,
        redirect: redirectUrl,
        ipn: ipnUrl,
      })
    );
    console.log('result: ', result);
    if (result === true) {
      const data = await firstValueFrom(
        this.paymentClient.send('payment.momo.extract-ipn-body', { ...body })
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
      logger.log('Invalid momo ipn request');
    }

    return res.status(200).send('OK');
  }

  /*
   * Redirect url for momo
   */
  @Get('return')
  async momoReturn(@Query() query: any) {
    try {
      const data = await firstValueFrom(
        this.paymentClient.send('payment.momo.extract', query)
      );

      return await this.paymentHelper.handlePaymentRedirect(data);
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to capture momo payment');
    }
  }
}
