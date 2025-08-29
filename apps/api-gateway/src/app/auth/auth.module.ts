import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ClientConfigsMap,
  MICROSERVICE_CLIENTS,
} from '../../utils/client-register.utils';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap[MICROSERVICE_CLIENTS.AUTH_SERVICE],
    ]),
  ],
  controllers: [AuthController],
})
export class AuthModule {}
