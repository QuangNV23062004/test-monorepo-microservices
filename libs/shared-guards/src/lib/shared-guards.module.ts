import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';
import { RoleGuard } from './role.guard';
import { getClient } from '@nest-microservices/shared-utils';
@Module({
  imports: [
    ClientsModule.register([
      getClient('AUTH_SERVICE', Transport.TCP, 'localhost', 3001),
    ]),
  ],
  providers: [AuthGuard, RoleGuard],
  exports: [AuthGuard, RoleGuard],
})
export class SharedModule {}
