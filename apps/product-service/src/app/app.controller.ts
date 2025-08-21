import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { IProductItem, IQuery } from '@nest-microservices/shared-interfaces';

const logger = new Logger('ProductService');

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
        location: 'ProductService',
      });
    }
  }

  @MessagePattern('product.get-all')
  async getProducts(@Payload() data: { query: IQuery }) {
    logger.log('Using pattern: product.get-all');
    try {
      return await this.appService.getProducts({
        page: data?.query?.page || 1,
        size: data?.query?.size || 5,
        search: data?.query?.search || '',
        searchField: data?.query?.searchField || 'name',
        order: data?.query?.order || 'asc',
        sortBy: data?.query?.sortBy || 'createdAt',
        options: data?.query?.options,
      });
    } catch (error) {
      this.handleError(error, 'Failed to get products');
    }
  }

  @MessagePattern('product.get-by-id')
  async getProduct(@Payload() data: { id: string }) {
    logger.log('Using pattern: product.get-by-id');
    try {
      return this.appService.getProduct(data.id);
    } catch (error) {
      this.handleError(error, 'Failed to get product by id');
    }
  }

  @MessagePattern('product.create')
  async createProduct(
    @Payload()
    data: {
      name: string;
      images: string[];
      quantity: number;
      price: number;
      currentPrice: number;
    }
  ) {
    logger.log('Using pattern: product.create');
    try {
      return this.appService.createProduct(
        data.name,
        data.images,
        data.quantity,
        data.price,
        data.currentPrice
      );
    } catch (error) {
      this.handleError(error, 'Failed to create product');
    }
  }

  @MessagePattern('D')
  async updateProduct(
    @Payload()
    data: {
      id: string;
      name?: string;
      images?: string[];
      quantity?: number;
      price?: number;
      currentPrice?: number;
    }
  ) {
    logger.log('Using pattern: product.update');
    try {
      return await this.appService.updateProduct(
        data.id,
        data.name,
        data.images,
        data.quantity,
        data.price,
        data.currentPrice
      );
    } catch (error) {
      this.handleError(error, 'Failed to update product');
    }
  }

  @MessagePattern('product.update-quantity')
  async updateProductQuantity(
    @Payload() data: { productList: IProductItem[]; mode: string }
  ) {
    logger.log('Using pattern: product.update-quantity');
    try {
      return await this.appService.updateProductsQuantity(
        data.productList,
        data.mode
      );
    } catch (error) {
      this.handleError(error, 'Failed to update product quantity');
    }
  }

  @MessagePattern('product.delete')
  async deleteProduct(@Payload() data: { id: string }) {
    logger.log('Using pattern: product.delete');
    try {
      return await this.appService.deleteProduct(data.id);
    } catch (error) {
      this.handleError(error, 'Failed to delete product');
    }
  }

  @MessagePattern('product.check-product-list')
  async checkProductList(@Payload() data: { productList: IProductItem[] }) {
    logger.log('Using pattern: product.check-product-list');
    try {
      return this.appService.checkProductList(data.productList);
    } catch (error) {
      this.handleError(error, 'Failed to check product list');
    }
  }
}
