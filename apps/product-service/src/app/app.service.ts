import {
  IPaginatedResponse,
  IProductItem,
  IQuery,
} from '@nest-microservices/shared-interfaces';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ProductRepository } from './repository/product.repository';
import { Product } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(private readonly productRepository: ProductRepository) {}

  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  getProducts = async (query: IQuery): Promise<IPaginatedResponse> => {
    return this.productRepository.getAllWithPagination(
      query.page,
      query.size,
      query.search,
      query.searchField,
      query.order,
      query.sortBy,
      query.options
    );
  };

  getProduct = async (id: string): Promise<Product> => {
    return this.productRepository.getById(id);
  };

  createProduct = async (
    name: string,
    images: string[],
    quantity: number,
    price: number,
    currentPrice: number
  ) => {
    return await this.productRepository.create({
      name,
      images,
      quantity,
      price,
      currentPrice,
    });
  };

  checkProductList = async (productList: IProductItem[]) => {
    const aggregated = productList.reduce((acc, item) => {
      acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    const ids = Object.keys(aggregated);
    const products = await this.productRepository.getProductLists(ids);

    if (products.length < ids.length) {
      throw new RpcException({
        code: HttpStatus.BAD_REQUEST,
        message: 'Invalid product',
        location: 'ProductService',
      });
    }

    for (const product of products) {
      const requestedQty = aggregated[product.id];
      if (requestedQty > product.quantity) {
        throw new RpcException({
          code: HttpStatus.BAD_REQUEST,
          message: `Insufficient product: ${product.name}`,
          location: 'ProductService',
        });
      }
    }
  };

  updateProduct = async (
    id: string,
    name?: string,
    images?: string[],
    quantity?: number,
    price?: number,
    currentPrice?: number
  ) => {
    let data = {};
    if (name) data = { ...data, name };
    if (images) data = { ...data, images };
    if (quantity) data = { ...data, quantity };
    if (price) data = { ...data, price };
    if (currentPrice) data = { ...data, currentPrice };

    await this.productRepository.updateById(id, data);
  };

  updateProductsQuantity = async (
    productList: IProductItem[],
    mode: string
  ) => {
    const ids = productList.map((p) => {
      return p.productId;
    });
    const products = await this.productRepository.getProductLists(ids);
    if (products.length < productList.length) {
      throw new RpcException({
        code: HttpStatus.BAD_REQUEST,
        message: 'Invalid product',
        locaiton: 'ProductService',
      });
    }

    const newProductList = productList.map((p) => {
      const product = products.find((product) => product.id === p.productId);
      if (mode.toLocaleLowerCase() === 'checkout') {
        if (p.quantity > product.quantity) {
          throw new RpcException({
            code: HttpStatus.BAD_REQUEST,
            message: 'Insufficient product',
            location: 'ProductService',
          });
        }
        p.quantity = product.quantity - p.quantity;
      } else if (mode.toLocaleLowerCase() === 'refund') {
        p.quantity = product.quantity + p.quantity;
      }
      return p;
    });
    await this.productRepository.updateProductLists(newProductList);
  };

  deleteProduct = async (id: string) => {
    return this.productRepository.deleteById(id);
  };
}
