import { Roles } from '@nest-microservices/shared-decorators';
import {
  AuthGuard,
  RoleEnum,
  RoleGuard,
} from '@nest-microservices/shared-guards';
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
import { ApiQuery } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';

@Controller('receipt')
@UseGuards(AuthGuard, RoleGuard)
export class ReceiptController {
  constructor(
    @Inject('RECEIPT_SERVICE') private readonly receiptClient: ClientProxy
  ) {}

  @Roles(RoleEnum.ADMIN)
  @Get('all')
  async getReceipts() {
    return await firstValueFrom(this.receiptClient.send('receipt.all', {}));
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  @Get('user/:id')
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
  async getReceiptByUserId(
    @Param() id: string,
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('searchField') searchField: string,
    @Query('order') order: string,
    @Query('sortBy') sortBy: string,
    @Query('options') options: Record<string, any>,
    @Req() req: IAuthenticatedRequest
  ) {
    const userId = req?.user?.userId;
    const role = req?.user?.role;
    return await firstValueFrom(
      this.receiptClient.send('receipt.get-receipts-by-userId', {
        id: id,
        query: { page, size, search, searchField, order, sortBy, options },
        requesterId: userId,
        role: role,
      })
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
  async getAllWithPagination(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('searchField') searchField: string,
    @Query('order') order: string,
    @Query('sortBy') sortBy: string,
    @Query('options') options: Record<string, any>
  ) {
    return await firstValueFrom(
      this.receiptClient.send('receipt.all-with-pagination', {
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

  @Roles(RoleEnum.ADMIN, RoleEnum.USER)
  @Get(':id')
  async getReceipt(@Param() id: string, @Req() req: IAuthenticatedRequest) {
    return await firstValueFrom(
      this.receiptClient.send('receipt.get-by-id', {
        id,
        requesterId: req?.user?.userId,
        role: req?.user?.role,
      })
    );
  }
}
