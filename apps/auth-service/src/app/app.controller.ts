import { Controller, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private handleError(error: unknown, message: string) {
    const logger = new Logger('AuthService');
    logger.error(error);
    if (error instanceof RpcException) {
      throw error;
    } else {
      throw new RpcException({
        code: 500,
        message: `${error instanceof Error ? error.message : message}`,
        location: 'AuthService',
      });
    }
  }

  @MessagePattern('auth.register')
  async register(
    @Payload()
    registerDto: {
      email: string;
      name: string;
      birthDate: Date;
      hobby: string;
      password: string;
    }
  ) {
    try {
      return this.appService.register(
        registerDto.email,
        registerDto.name,
        registerDto.birthDate,
        registerDto.hobby,
        registerDto.password
      );
    } catch (error) {
      this.handleError(error, 'Failed to register');
    }
  }

  @MessagePattern('auth.login')
  async login(@Payload() loginDto: { email: string; password: string }) {
    try {
      return this.appService.login(loginDto.email, loginDto.password);
    } catch (error) {
      this.handleError(error, 'Failed to login');
    }
  }

  @MessagePattern('auth.verify-token')
  async verifyAccessToken(@Payload() data: { token: string }) {
    try {
      return this.appService.verifyAccessToken(data.token);
    } catch (error) {
      this.handleError(error, 'Failed to verify token');
    }
  }

  @MessagePattern('auth.verify-email')
  async verifyEmail(@Payload() data: { token: string }) {
    try {
      return this.appService.confirmEmailToken(data.token);
    } catch (error) {
      this.handleError(error, 'Failed to verify email token');
    }
  }

  @MessagePattern('auth.renew-tokens')
  async renewAccessAndRefreshToken(@Payload() data: { token: string }) {
    try {
      return this.appService.renewAccessTokenAndRefreshToken(data.token);
    } catch (error) {
      this.handleError(error, 'Failed to renew tokens');
    }
  }

  @MessagePattern('auth.me')
  async getUserByAccessToken(@Payload() data: { token: string }) {
    try {
      return this.appService.getUserByAccessToken(data.token);
    } catch (error) {
      this.handleError(error, 'Failed to get user info');
    }
  }
}
