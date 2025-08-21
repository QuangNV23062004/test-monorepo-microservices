import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ClientConfigsMap } from '../../utils/client-register';
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap['AUTH_SERVICE'],
      ClientConfigsMap['PRODUCT_SERVICE'],
    ]),
  ],
  controllers: [ProductController],
})
export class ProductModule {}
