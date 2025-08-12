import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MomoModule } from './momo/momo.module';
import { QueueModule } from './queue/queue.module';
import { QueueService } from './queue/queue.service';

@Module({
  imports: [MomoModule, QueueModule],
  controllers: [AppController],
  providers: [AppService, QueueService],
})
export class AppModule {}
