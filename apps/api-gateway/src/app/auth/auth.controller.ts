import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { errorHandler } from '../../utils/error-handler';
import { AuthGuard } from '@nest-microservices/shared-guards';
import { IAuthenticatedRequest } from '@nest-microservices/shared-interfaces';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy
  ) {}

  @Post('register')
  async register(
    @Body()
    registerDto: {
      email: string;
      name: string;
      birthDate: Date;
      hobby: string;
      password: string;
    }
  ) {
    try {
      return await firstValueFrom(
        this.authClient.send('auth.register', registerDto)
      );
    } catch (error) {
      errorHandler(error, 'auth', 'Failed to register');
    }
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      return await firstValueFrom(this.authClient.send('auth.login', loginDto));
    } catch (error) {
      errorHandler(error, 'auth', 'Failed to login');
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    try {
      return await firstValueFrom(
        this.authClient.send('auth.verify-email', { token: token })
      );
    } catch (error) {
      errorHandler(error, 'auth', 'Failed to verify email');
    }
  }

  @Post('renew-tokens')
  async renewTokens(@Body() body: { refreshToken: string }) {
    try {
      const token = body.refreshToken;
      return await firstValueFrom(
        this.authClient.send('auth.renew-tokens', { token })
      );
    } catch (error) {
      errorHandler(error, 'auth', 'Failed to renew tokens');
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getUserByAccessToken(@Req() request: IAuthenticatedRequest) {
    try {
      // AuthGuard already validated the token, now get full user details
      const token = (request.headers as any)?.authorization?.split(' ')[1];
      return await firstValueFrom(this.authClient.send('auth.me', { token }));
    } catch (error) {
      errorHandler(error, 'auth', 'Failed to get user by access token');
    }
  }
}
