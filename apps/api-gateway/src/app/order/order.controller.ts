import { Roles } from '@nest-microservices/shared-decorators';
import { AuthGuard, RoleGuard } from '@nest-microservices/shared-guards';
import {
  IAuthenticatedRequest,
  IQuery,
} from '@nest-microservices/shared-interfaces';
import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RoleEnum } from '@nest-microservices/shared-enum';
import { ApiQuery } from '@nestjs/swagger';

@Controller('order')
@UseGuards(AuthGuard, RoleGuard)
export class OrderController {
  constructor(
    @Inject('ORDER_SERVICE') private readonly orderClient: ClientProxy
  ) {}

  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  @Get('user/:id')
  async getOrderByUserId(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('searchField') searchField: string,
    @Query('order') order: string,
    @Query('sortBy') sortBy: string,
    @Query('options') options: Record<string, any>,
    @Req() req: IAuthenticatedRequest
  ) {
    const requesterId = req?.user?.userId;
    const role = req?.user?.role;

    return await firstValueFrom(
      this.orderClient.send('order.get-by-userId', {
        userId: id,
        query: {
          page,
          size,
          search,
          searchField,
          order,
          sortBy,
          options,
        },
        requesterId,
        role,
      })
    );
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  @Get(':id')
  async getOrder(@Param('id') id: string, @Req() req: IAuthenticatedRequest) {
    const requesterId = req?.user?.userId;
    const role = req?.user?.role;

    return await firstValueFrom(
      this.orderClient.send('order.get-by-id', { id, requesterId, role })
    );
  }

  @Roles(RoleEnum.ADMIN)
  @Get('')
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
  async getOrders(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('searchField') searchField: string,
    @Query('order') order: string,
    @Query('sortBy') sortBy: string,
    @Query('options') options: Record<string, any>
  ) {
    return await firstValueFrom(
      this.orderClient.send('order.get-all-with-pagination', {
        query: {
          page,
          size,
          search,
          searchField,
          order,
          sortBy,
          options,
        },
      })
    );
  }
}
