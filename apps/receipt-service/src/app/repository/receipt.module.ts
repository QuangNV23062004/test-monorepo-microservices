import { Module } from '@nestjs/common';
import { ReceiptRepository } from './receipt.repository';
import { ReceiptItemRepository } from './receipt-item.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReceiptRepository, ReceiptItemRepository],
  exports: [ReceiptRepository, ReceiptItemRepository],
})
export class ReceiptModule {}
