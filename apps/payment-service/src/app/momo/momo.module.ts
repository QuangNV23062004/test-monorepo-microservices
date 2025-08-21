import { Module } from '@nestjs/common';
import { MomoController } from './momo.controller';
import { MomoService } from './momo.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getClient } from '@nest-microservices/shared-utils';
@Module({
  imports: [
    ClientsModule.register([
      getClient('PRODUCT_SERVICE', Transport.TCP, 'localhost', 3007),
    ]),
  ],
  controllers: [MomoController],
  providers: [MomoService],
})
export class MomoModule {}
