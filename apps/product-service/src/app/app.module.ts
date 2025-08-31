import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import ProductModule from './repository/product.module';

@Module({
  imports: [PrismaModule, ProductModule, RedisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
