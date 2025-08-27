import { IProductItem } from '@nest-microservices/shared-interfaces';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { VnpayService } from './vnpay.service';

@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

  @MessagePattern('payment.vnpay.create')
  async createVnpayPayment(
    @Payload()
    data: {
      userId: string;
      productList: IProductItem[];
      redirect: string;
      ipn: string;
      ipAddr?: string;
    }
  ) {
    return await this.vnpayService.createVNPayPayment(
      data.userId,
      data.productList,
      data.redirect,
      data.ipn,
      data.ipAddr
    );
  }

  @MessagePattern('payment.vnpay.extract')
  async extractVnpayQuery(@Payload() data: any) {
    return await this.vnpayService.extractVnpayQuery(data);
  }

  @MessagePattern('payment.vnpay.verify-ipn')
  async verifyVnpayIpn(@Payload() data: any) {
    return await this.vnpayService.verifyVnpaySecureHash(data);
  }
}
