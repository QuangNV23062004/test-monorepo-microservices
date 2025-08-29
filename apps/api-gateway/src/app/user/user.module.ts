import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SharedModule } from '@nest-microservices/shared-guards';
import {
  ClientConfigsMap,
  MICROSERVICE_CLIENTS,
} from '../../utils/client-register.utils';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap[MICROSERVICE_CLIENTS.AUTH_SERVICE],
      ClientConfigsMap[MICROSERVICE_CLIENTS.USER_SERVICE],
    ]),
  ],
  controllers: [UserController],
})
export class UserModule {}
