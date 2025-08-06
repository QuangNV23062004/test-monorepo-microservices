import {
  Controller,
  Get,
  Inject,
  HttpException,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('users')
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
  ) {}

  @Get()
  async findAll() {
    try {
      return await firstValueFrom(this.userClient.send('user.find-all', {}));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findById(@Body('id') id: string) {
    try {
      return await firstValueFrom(this.userClient.send('user.find-by-id', id));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch user',
        HttpStatus.NOT_FOUND
      );
    }
  }
}
