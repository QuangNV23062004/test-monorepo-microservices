import { Module } from '@nestjs/common';
import { MomoController } from './momo.controller';
import { MomoService } from './momo.service';

@Module({
  imports: [],
  controllers: [MomoController],
  providers: [MomoService],
})
export class MomoModule {}
