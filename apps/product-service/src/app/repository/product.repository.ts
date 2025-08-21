import {
  BaseRepository,
  IPrismaService,
} from '@nest-microservices/shared-repository';
import { Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { IProductItem } from '@nest-microservices/shared-interfaces';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(prisma: PrismaService) {
    super(prisma, 'product');
  }

  async getProductLists(ids: string[], tx?: IPrismaService) {
    const model = this.getModel(tx);
    return await model.findMany({
      where: {
        id: { in: ids },
        isDeleted: false,
      },
    });
  }

  async updateProductLists(productLists: IProductItem[]) {
    const values = productLists
      .map((p) => `('${p.productId}', ${p.quantity})`)
      .join(',');

    const query = `
    UPDATE "products" AS p
    SET quantity = v.quantity
    FROM (VALUES ${values}) AS v(id, quantity)
    WHERE p.id = v.id
  `;

    await this.prisma.$executeRawUnsafe(query);
  }
}
