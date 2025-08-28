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
import { errorHandler } from '../../utils/error-handler.utils';
import {
  IAuthenticatedRequest,
  IProductItem,
} from '@nest-microservices/shared-interfaces';
import dotenv from 'dotenv';
import { PaymentModeEnum } from '@nest-microservices/shared-enum';
import { PaymentHelper } from './utils/payment-helper.utils';
import { MICROSERVICE_CLIENTS } from '../../utils/client-register.utils';
dotenv.config();

const logger = new Logger('ApiGateway - VnpayController');

@Controller('payment/vnpay')
export class VnpayController {
  constructor(
    @Inject(MICROSERVICE_CLIENTS.PAYMENT_SERVICE)
    private readonly paymentClient: ClientProxy,
    @Inject(MICROSERVICE_CLIENTS.PRODUCT_SERVICE)
    private readonly productClient: ClientProxy,
    @Inject(MICROSERVICE_CLIENTS.USER_SERVICE)
    private readonly userClient: ClientProxy,
    private readonly paymentHelper: PaymentHelper
  ) {}
  @Post('create')
  @UseGuards(AuthGuard)
  async createVnpayPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() request: Request & IAuthenticatedRequest
  ) {
    try {
      const userId = request.user?.userId;
      const ipAddr =
        (request.headers['x-forwarded-for'] as string) ||
        request.socket?.remoteAddress ||
        request.ip;
      const products = await this.paymentHelper.checkProductList(
        createPaymentDto.productList as IProductItem[]
      );

      const assignedPriceList = this.paymentHelper.assignPriceToProductList(
        createPaymentDto.productList as IProductItem[],
        products
      );

      const redirectUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/vnpay/return`;

      const ipnUrl = `${
        process.env.SERVER_URL || 'http://localhost:3000'
      }/api/payment/vnpay/return`;

      const url = await firstValueFrom(
        this.paymentClient.send('payment.vnpay.create', {
          userId,
          productList: assignedPriceList,
          redirect: redirectUrl,
          ipn: ipnUrl,
          ipAddr,
        })
      );
      return { url: url, message: 'Successfully created vnpay payment url' };
    } catch (error) {
      errorHandler(error, 'payment', 'Failed to create vnpay paymet');
    }
  }

  @Get('return')
  async vnpayReturn(@Query() query: any) {
    const data = await firstValueFrom(
      this.paymentClient.send('payment.vnpay.extract', query)
    );

    return await this.paymentHelper.handlePaymentRedirect(data);
  }

  @Get('ipn')
  async vnpayIpn(@Query() query: any, @Res() res: Response) {
    const verify = await firstValueFrom(
      this.paymentClient.send('payment.vnpay.verify-ipn', query)
    );
    if (verify) {
      const data = await firstValueFrom(
        this.paymentClient.send('payment.vnpay.extract', query)
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
    }

    return res.status(200).send('OK');
  }
}
