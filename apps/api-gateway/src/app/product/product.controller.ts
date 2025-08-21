import { IQuery } from '@nest-microservices/shared-interfaces';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import {
  AuthGuard,
  RoleEnum,
  RoleGuard,
} from '@nest-microservices/shared-guards';
import { Roles } from '@nest-microservices/shared-decorators';
import { ApiQuery } from '@nestjs/swagger';

@Controller('product')
export class ProductController {
  constructor(
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy
  ) {}

  @Get()
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
  async getAllProduct(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('searchField') searchField: string,
    @Query('order') order: string,
    @Query('sortBy') sortBy: string,
    @Query('options') options: Record<string, any>
  ) {
    return await firstValueFrom(
      this.productClient.send('product.get-all', {
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

  @Get(':id')
  async getProductById(@Param() id: string) {
    return await firstValueFrom(
      this.productClient.send('product.get-by-id', { id })
    );
  }

  @Post('')
  @Roles(RoleEnum.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await firstValueFrom(
      this.productClient.send('product.create', { ...createProductDto })
    );
  }

  @Roles(RoleEnum.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @Patch(':id')
  async updateProduct(@Body() updateProductDto: UpdateProductDto) {
    return await firstValueFrom(
      this.productClient.send('product.update', { ...updateProductDto })
    );
  }

  @Roles(RoleEnum.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  @Delete(':id')
  async deleteProduct(@Param() id: string) {
    return await firstValueFrom(
      this.productClient.send('product.delete', { id })
    );
  }
}
