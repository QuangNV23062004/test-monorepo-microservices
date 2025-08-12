import { Injectable } from '@nestjs/common';
import { IPaginatedResponse } from '@nest-microservices/shared-interfaces';

// Generic interface for any Prisma-like database service
export interface IPrismaService {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
  [key: string]: any; // For dynamic model access
}

@Injectable()
export default abstract class BaseRepository<T> {
  protected readonly modelName: string;

  constructor(protected readonly prisma: IPrismaService, modelName: string) {
    this.modelName = modelName;
  }

  protected getModel(tx?: IPrismaService) {
    const client = tx || this.prisma;
    return (client as any)[this.modelName];
  }

  protected get model() {
    return this.getModel();
  }

  async getAll(
    options: Record<string, any> = {},
    tx?: IPrismaService
  ): Promise<Array<T>> {
    try {
      const model = this.getModel(tx);
      return await model.findMany({
        ...Object.fromEntries(
          Object.entries(options || {}).filter(([key]) => key !== 'where')
        ),
        where: {
          ...options?.['where'],
          isDeleted: false,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to get all: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  async getAllWithPagination(
    page: number,
    size: number,
    search?: string,
    searchField?: string,
    order?: 'asc' | 'desc',
    sortBy?: string,
    options?: Record<string, any>,
    tx?: IPrismaService
  ): Promise<IPaginatedResponse> {
    const skip = (page - 1) * size;

    // Build where clause
    const whereClause: any = {
      isDeleted: false,
      ...options?.['where'],
    };

    // Add search condition
    if (search && searchField) {
      whereClause[searchField] = {
        contains: search,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    // Build query object
    const query: any = {
      take: size,
      skip: skip,
      where: whereClause,
    };

    // Add sorting
    if (sortBy && order) {
      query.orderBy = {
        [sortBy]: order,
      };
    }

    try {
      const model = this.getModel(tx);
      // Get data and total count in parallel
      const [data, total] = await Promise.all([
        model.findMany(query),
        model.count({ where: whereClause }),
      ]);

      const totalPage = Math.ceil(total / size);

      return {
        data,
        page,
        size,
        totalPage,
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get paginated data: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async getById(
    id: string,
    options?: Record<string, any>,
    tx?: IPrismaService
  ): Promise<T | null> {
    try {
      const model = this.getModel(tx);
      return await model.findFirst({
        where: {
          id: id,
          isDeleted: false,
          ...options?.['where'],
        },
        ...Object.fromEntries(
          Object.entries(options || {}).filter(([key]) => key !== 'where')
        ),
      });
    } catch (error) {
      throw new Error(
        `Failed to get by Id: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  async create(data: Record<string, any>, tx?: IPrismaService): Promise<T> {
    try {
      const model = this.getModel(tx);
      return await model.create({
        data: {
          ...data,
          isDeleted: false, // Ensure new records are not deleted
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to create: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  async updateById(
    id: string,
    data: Record<string, any>,
    tx?: IPrismaService
  ): Promise<T | null> {
    try {
      const model = this.getModel(tx);
      await model.updateMany({
        where: {
          id: id,
          isDeleted: false,
        },
        data: data,
      });

      // Return the updated record
      return await model.findFirst({
        where: {
          id: id,
          isDeleted: false,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to update by Id: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async deleteById(id: string, tx?: IPrismaService): Promise<boolean> {
    try {
      const model = this.getModel(tx);
      await model.updateMany({
        where: {
          id: id,
          isDeleted: false,
        },
        data: { isDeleted: true },
      });
      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete by Id: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  // Utility method to run operations within a transaction
  async runInTransaction<R>(
    operation: (tx: IPrismaService) => Promise<R>
  ): Promise<R> {
    return await this.prisma.$transaction(operation);
  }
}
