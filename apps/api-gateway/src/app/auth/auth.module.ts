import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientConfigsMap } from '../../utils/client-register';

@Module({
  imports: [ClientsModule.register([ClientConfigsMap['AUTH_SERVICE']])],
  controllers: [AuthController],
})
export class AuthModule {}
