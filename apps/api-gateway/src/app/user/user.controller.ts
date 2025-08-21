import { IAuthenticatedRequest } from '@nest-microservices/shared-interfaces';
import {
  Controller,
  Get,
  Inject,
  HttpException,
  HttpStatus,
  Body,
  Query,
  Patch,
  Req,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UpdateUserDto } from './dtos/update-user.dto';
import { AuthGuard, RoleEnum } from '@nest-microservices/shared-guards';
import { RoleGuard } from '@nest-microservices/shared-guards';
import { Roles } from '@nest-microservices/shared-decorators';
import { errorHandler } from '../../utils/error-handler';
import { ApiQuery } from '@nestjs/swagger';

@Controller('users')
@UseGuards(AuthGuard, RoleGuard)
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy
  ) {}

  @Get('all')
  @Roles(RoleEnum.ADMIN)
  async findAll() {
    try {
      return await firstValueFrom(this.userClient.send('user.find-users', {}));
    } catch (error) {
      errorHandler(error, 'user', 'Failed to find all users');
    }
  }

  @Get(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  async findById(@Param('id') id: string, @Req() req: IAuthenticatedRequest) {
    try {
      const requesterId = req?.user?.userId;
      return await firstValueFrom(
        this.userClient.send('user.find-user', { id, requesterId })
      );
    } catch (error) {
      errorHandler(error, 'user', 'Failed to find user by id');
    }
  }

  @Get()
  @Roles(RoleEnum.ADMIN)
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term',
  })
  @ApiQuery({
    name: 'searchField',
    required: false,
    type: String,
    description: 'Field to search in',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    type: String,
    description: 'Sort order (asc/desc)',
    example: 'asc',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'options',
    required: false,
    type: 'object',
    description: 'Additional filter options',
  })
  async findUsersWithPagination(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('searchField') searchField: string,
    @Query('order') order: string,
    @Query('sortBy') sortBy: string,
    @Query('options') options: Record<string, any>
  ) {
    try {
      return await firstValueFrom(
        this.userClient.send('user.find-users-with-pagination', {
          page,
          size,
          search,
          searchField,
          order,
          sortBy,
          options,
        })
      );
    } catch (error) {
      errorHandler(error, 'user', 'Failed to find user with pagination');
    }
  }

  @Patch(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @Param('id') id: string,
    @Req() req: IAuthenticatedRequest
  ) {
    try {
      const requesterId = req?.user?.userId;
      return await firstValueFrom(
        this.userClient.send('user.update', {
          ...updateUserDto,
          id,
          requesterId,
        })
      );
    } catch (error) {
      errorHandler(error, 'user', 'Failed to update user');
    }
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  async delete(@Param('id') id: string, @Req() req: IAuthenticatedRequest) {
    try {
      return await firstValueFrom(
        this.userClient.send('user.delete', {
          id,
          requesterId: req.user.userId,
        })
      );
    } catch (error) {
      errorHandler(error, 'user', 'Failed to delete user');
    }
  }
}
