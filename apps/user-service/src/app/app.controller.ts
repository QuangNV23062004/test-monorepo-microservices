import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IQuery } from '@nest-microservices/shared-interfaces';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('user.find-users')
  async findAll() {
    return this.appService.findUsers();
  }

  @MessagePattern('user.find-user')
  async findById(@Payload() id: string, requesterId: string) {
    return this.appService.findUser(id, requesterId);
  }

  @MessagePattern('user.find-users-with-pagination')
  async findUsersWithPagination(
    @Payload() page?: number,
    size?: number,
    search?: string,
    searchField?: string,
    order?: string,
    sortBy?: string,
    options?: Record<string, any>
  ) {
    return this.appService.findUsersWithPagination({
      page: page || 1,
      size: size || 5,
      search: search || '',
      searchField: searchField || '',
      order: (order as 'asc' | 'desc') || 'asc',
      sortBy: sortBy || 'createdAt',
      options: options || {},
    });
  }

  @MessagePattern('user.update')
  async update(
    @Payload() id: string,
    requesterId: string,
    name?: string,
    birthDate?: string,
    hobby?: string,
    email?: string,
    password?: string,
    oldPassword?: string,
    role?: string
  ) {
    return this.appService.update(
      id,
      requesterId,
      name,
      birthDate,
      hobby,
      email,
      password,
      oldPassword,
      role
    );
  }

  @MessagePattern('user.delete')
  async delete(@Payload() id: string, requesterId: string) {
    return this.appService.deleteUser(id, requesterId);
  }
}
