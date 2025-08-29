import { Controller, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  IPaginatedResponse,
  IQuery,
} from '@nest-microservices/shared-interfaces';
import { Order, User } from '@prisma/client';

const logger = new Logger('UserService');
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private handleError(error: unknown, message: string): RpcException {
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
  async findAll(): Promise<User[]> {
    logger.log('Using pattern: user.find-users');
    try {
      return this.appService.findUsers();
    } catch (error) {
      this.handleError(error, 'Failed to find users');
    }
  }

  @MessagePattern('user.find-user')
  async findById(
    @Payload() payload: { id: string; requesterId: string }
  ): Promise<User> {
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
    @Payload() payload?: Partial<IQuery>
  ): Promise<IPaginatedResponse> {
    logger.log('Using pattern: user.find-users-with-pagination');
    try {
      const {
        page = 1,
        size = 5,
        search = '',
        searchField = 'name',
        order = 'asc',
        sortBy = 'createdAt',
        options = {},
      } = payload || {};

      return this.appService.findUsersWithPagination({
        page: Number(page) || 1,
        size: Number(size) || 5,
        search: String(search ?? ''),
        searchField: String(searchField ?? 'name'),
        order: (order as 'asc' | 'desc') ?? 'asc',
        sortBy: String(sortBy ?? 'createdAt'),
        options: options || {},
      } as IQuery);
    } catch (error) {
      this.handleError(error, 'Failed to find users with pagination');
    }
  }

  @MessagePattern('user.update')
  async update(
    @Payload()
    payload: {
      id: string;
      requesterId: string;
      name?: string;
      birthDate?: string;
      hobby?: string;
      email?: string;
      password?: string;
      oldPassword?: string;
      role?: string;
    }
  ): Promise<User> {
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
  async delete(
    @Payload() payload: { id: string; requesterId: string }
  ): Promise<boolean> {
    logger.log('Using pattern: user.delete');
    try {
      const { id, requesterId } = payload;
      return this.appService.deleteUser(id, requesterId);
    } catch (error) {
      this.handleError(error, 'Failed to delete user');
    }
  }

  @MessagePattern('user.update-balance')
  async updateBalance(
    @Payload()
    data: {
      id: string;
      amount: number;
      mode: string;
      queueData?: object;
    }
  ): Promise<User> {
    logger.log('Using pattern: user.update-balance');
    try {
      return await this.appService.updateUserBalance(
        data.id,
        data.amount,
        data.mode,
        data.queueData
      );
    } catch (error) {
      this.handleError(error, 'Failed to update user balance');
    }
  }
}
