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
import { UpdateUserDto } from '../../dto/users/update-user.dto';
import { AuthGuard, RoleEnum } from '@nest-microservices/shared-guards';
import { RoleGuard } from '@nest-microservices/shared-guards';
import { Roles } from '@nest-microservices/shared-decorators';

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
      return await firstValueFrom(this.userClient.send('user.find-all', {}));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @Roles(RoleEnum.USER)
  async findById(@Param('id') id: string) {
    try {
      return await firstValueFrom(this.userClient.send('user.find-by-id', id));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch user',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Get()
  @Roles(RoleEnum.ADMIN)
  async findUsersWithPagination(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('searchField') searchField: string,
    @Query('order') order: string,
    @Query('sortBy') sortBy: string,
    @Query('options') options: Record<string, any>
  ) {
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
  }

  @Patch(':id')
  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @Param('id') id: string,
    @Req() req: IAuthenticatedRequest
  ) {
    const requesterId = req.user.userId;
    return await firstValueFrom(
      this.userClient.send('user.update', {
        ...updateUserDto,
        id,
        requesterId,
      })
    );
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  async delete(@Param('id') id: string, @Req() req: IAuthenticatedRequest) {
    return await firstValueFrom(
      this.userClient.send('user.delete', {
        id,
        requesterId: req.user.userId,
      })
    );
  }
}
