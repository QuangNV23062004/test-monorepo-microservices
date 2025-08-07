import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, catchError, map } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { publicRoutes } from './public-routes';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy // Inject microservice client
  ) {}

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;

    const accessToken = this.extractTokenFromHeader(request);

    //public route
    if (
      publicRoutes.some(
        (route) => route.method === method && route.path === path
      )
    ) {
      //if token is provided => handle, else ignore
      if (accessToken) {
        return this.authClient
          .send<{ userId: string; role: string }>(
            { cmd: 'auth.verify-token' },
            { accessToken }
          )
          .pipe(
            map((payload) => {
              request['user'] = payload; //{ userId, role }
              return true;
            }),
            catchError((error) => {
              throw new RpcException({
                message: error.message || 'Invalid access token',
                code: 401,
                location: 'AuthGuard',
              });
            })
          );
      }

      return true;
    }

    if (!accessToken) {
      throw new RpcException({
        message: 'Missing or invalid Authorization header',
        code: 401,
        location: 'AuthGuard',
      });
    }

    // Send token to AuthService via microservice using 'auth.verify-token' pattern
    return this.authClient
      .send<{ userId: string; role: string }>(
        { cmd: 'auth.verify-token' },
        { accessToken }
      )
      .pipe(
        map((payload) => {
          request['user'] = payload; //{ userId, role }
          return true;
        }),
        catchError((error) => {
          throw new RpcException({
            message: error.message || 'Invalid access token',
            code: 401,
            location: 'AuthGuard',
          });
        })
      );
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers?.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
