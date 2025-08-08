import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { Request } from 'express';
import { IAuthenticatedRequest } from '@nest-microservices/shared-interfaces';
import { RoleEnum } from '@nest-microservices/shared-enum';
import { ROLES_KEY } from '@nest-microservices/shared-decorators';
import { Reflector } from '@nestjs/core';
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context
      .switchToHttp()
      .getRequest<Request | IAuthenticatedRequest>();
    const user = (request as IAuthenticatedRequest)?.user as
      | { userId: string; role: string }
      | undefined;

    if (allowedRoles.includes(RoleEnum.GUEST)) {
      return true;
    }

    // Check if user exists (set by AuthGuard)
    if (!user || !user.role) {
      throw new RpcException({
        message: 'User or role not found in request',
        code: 401,
        location: 'RoleGuard',
      });
    }

    // Check if user's role is in the allowedRoles array
    const hasRole = allowedRoles.includes(user.role as RoleEnum);

    if (!hasRole) {
      throw new RpcException({
        message: `User role '${user.role}' is not authorized for this resource`,
        code: 403,
        location: 'RoleGuard',
      });
    }

    return true;
  }
}
