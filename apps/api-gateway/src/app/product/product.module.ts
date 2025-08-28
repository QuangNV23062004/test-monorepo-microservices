import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import {
  ClientConfigsMap,
  MICROSERVICE_CLIENTS,
} from '../../utils/client-register.utils';
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap[MICROSERVICE_CLIENTS.AUTH_SERVICE],
      ClientConfigsMap[MICROSERVICE_CLIENTS.PRODUCT_SERVICE],
    ]),
  ],
  controllers: [ProductController],
})
export class ProductModule {}
