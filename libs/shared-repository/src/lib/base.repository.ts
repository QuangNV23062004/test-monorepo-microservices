import { Injectable } from '@nestjs/common';
import { IPaginatedResponse } from '@nest-microservices/shared-interfaces';

// Generic interface for any Prisma-like database service
export interface IPrismaService {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  [key: string]: any; // For dynamic model access
}

@Injectable()
export default abstract class BaseRepository<T> {
  protected readonly modelName: string;

  constructor(protected readonly prisma: IPrismaService, modelName: string) {
    this.modelName = modelName;
  }

  // Get the specific model delegate from Prisma client
  protected get model() {
    return (this.prisma as any)[this.modelName];
  }

  async getAll(options: Record<string, any> = {}): Promise<Array<T>> {
    try {
      return await this.model.findMany({
        ...options,
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
    options?: Record<string, any>
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
      // Get data and total count in parallel
      const [data, total] = await Promise.all([
        this.model.findMany(query),
        this.model.count({ where: whereClause }),
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

  async getById(id: string): Promise<T | null> {
    try {
      return await this.model.findFirst({
        where: {
          id: id,
          isDeleted: false,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to get by Id: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  async create(data: Record<string, any>): Promise<T> {
    try {
      return await this.model.create({
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

  async updateById(id: string, data: Record<string, any>): Promise<T | null> {
    try {
      await this.model.updateMany({
        where: {
          id: id,
          isDeleted: false,
        },
        data: data,
      });

      // Return the updated record
      return await this.model.findFirst({
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

  async deleteById(id: string): Promise<boolean> {
    try {
      await this.model.updateMany({
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
}
