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
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { RenewTokensDto } from './dtos/renew-token.dto';
import { ReverifyDto } from './dtos/reverify.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const redirectUrl = `${process.env.SERVER_URL}/api/auth/verify-email`;

      return await firstValueFrom(
        this.authClient.send('auth.register', { ...registerDto, redirectUrl })
      );
    } catch (error) {
      errorHandler(error, 'auth', 'Failed to register');
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
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
  async renewTokens(@Body() renewTokensDto: RenewTokensDto) {
    try {
      const token = renewTokensDto.refreshToken;
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
      const cookies = (request.headers as any)?.cookie;
      let cookieToken;
      if (cookies) {
        const cookiePairs = cookies
          .split(';')
          .map((pair: string) => pair.trim());
        for (const pair of cookiePairs) {
          const [name, value] = pair.split('=');
          if (name === 'accessToken' && value) {
            cookieToken = decodeURIComponent(value);
          }
        }
      }
      const headerToken = (request.headers as any)?.authorization?.split(
        ' '
      )[1];

      const token = headerToken || cookieToken;
      return await firstValueFrom(this.authClient.send('auth.me', { token }));
    } catch (error) {
      errorHandler(error, 'auth', 'Failed to get user by access token');
    }
  }

  @Post('reverify')
  async reverifyUser(@Body() reverifyDto: ReverifyDto) {
    try {
      const email = reverifyDto.email;

      const redirectUrl = `${process.env.SERVER_URL}/api/auth/verify-email`;
      return await firstValueFrom(
        this.authClient.send('auth.reverify', { email, redirectUrl })
      );
    } catch (error) {
      errorHandler(error, 'auth', 'Failed to reverify user');
    }
  }
}
