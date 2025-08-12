import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { IQuery } from '@nest-microservices/shared-interfaces';

const logger = new Logger('UserService');
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private handleError(error: unknown, message: string) {
    logger.error(error);
    if (error instanceof RpcException) {
      throw error;
    } else {
      throw new RpcException({
        code: 500,
        message: `${error instanceof Error ? error.message : message}`,
        location: 'UserService',
      });
    }
  }

  @MessagePattern('user.find-users')
  async findAll() {
    logger.log('Using pattern: user.find-users');
    try {
      return this.appService.findUsers();
    } catch (error) {
      this.handleError(error, 'Failed to find users');
    }
  }

  @MessagePattern('user.find-user')
  async findById(@Payload() payload: any) {
    logger.log('Using pattern: user.find-user');
    try {
      const { id, requesterId } = payload;
      return this.appService.findUser(id, requesterId);
    } catch (error) {
      this.handleError(error, 'Failed to find user');
    }
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
    logger.log('Using pattern: user.find-users-with-pagination');
    try {
      return this.appService.findUsersWithPagination({
        page: page || 1,
        size: size || 5,
        search: search || '',
        searchField: searchField || '',
        order: (order as 'asc' | 'desc') || 'asc',
        sortBy: sortBy || 'createdAt',
        options: options || {},
      } as IQuery);
    } catch (error) {
      this.handleError(error, 'Failed to find users with pagination');
    }
  }

  @MessagePattern('user.update')
  async update(@Payload() payload: any) {
    logger.log('Using pattern: user.update');
    try {
      const {
        id,
        requesterId,
        name,
        birthDate,
        hobby,
        email,
        password,
        oldPassword,
        role,
      } = payload;

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
    } catch (error) {
      this.handleError(error, 'Failed to update user');
    }
  }

  @MessagePattern('user.delete')
  async delete(@Payload() payload: any) {
    logger.log('Using pattern: user.delete');
    try {
      const { id, requesterId } = payload;
      return this.appService.deleteUser(id, requesterId);
    } catch (error) {
      this.handleError(error, 'Failed to delete user');
    }
  }
}
