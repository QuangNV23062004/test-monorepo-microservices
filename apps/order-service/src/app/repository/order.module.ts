import { Module } from '@nestjs/common';
import OrderRepository from './order.repository';
import OrderItemRepository from './order-item.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OrderRepository, OrderItemRepository],
  exports: [OrderRepository, OrderItemRepository],
})
export class OrderModule {}
