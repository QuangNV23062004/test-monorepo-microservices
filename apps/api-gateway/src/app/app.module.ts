import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { AuthModule } from './auth/auth.module';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { AuthController } from './auth/auth.controller';
import { LoggerMiddleware } from '../middleware/logger.middleware';
import { MicroserviceClients } from '../utils/client-register';
import { PaymentModule } from './payment/payment.module';
import { ReceiptController } from './receipt/receipt.controller';
import { OrderController } from './order/order.controller';
import { OrderModule } from './order/order.module';
import { ReceiptModule } from './receipt/receipt.module';
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ClientsModule.register(MicroserviceClients),
    AuthModule,
    UserModule,
    PaymentModule,
    OrderModule,
    ReceiptModule,
    ProductModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    ReceiptController,
    OrderController,
  ],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
