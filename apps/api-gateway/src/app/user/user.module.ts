import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SharedModule } from '@nest-microservices/shared-guards';
import { ClientConfigsMap } from '../../utils/client-register';

@Module({
  imports: [
    ClientsModule.register([
      ClientConfigsMap['AUTH_SERVICE'],
      ClientConfigsMap['USER_SERVICE'],
    ]),
  ],
  controllers: [UserController],
})
export class UserModule {}
