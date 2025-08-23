import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReceiptModule } from './repository/receipt.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ReceiptModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
