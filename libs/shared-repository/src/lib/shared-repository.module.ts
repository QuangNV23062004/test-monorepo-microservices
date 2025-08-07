import { Module } from '@nestjs/common';
import BaseRepository from './base.repository';

@Module({
  controllers: [],
  providers: [],
  exports: [BaseRepository],
})
export class SharedRepositoryModule {}
