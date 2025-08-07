import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';
import { BaseRepository } from '@nest-microservices/shared-repository';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.model.findUnique({
      where: {
        email,
        isDeleted: false,
      },
    });
  }
}
