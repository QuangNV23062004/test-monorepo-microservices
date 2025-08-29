import ejs from 'ejs';
import nodemailer from 'nodemailer';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import {
  IPaginatedResponse,
  IQuery,
} from '@nest-microservices/shared-interfaces';
import { Order, User } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { RoleEnum } from '@nest-microservices/shared-guards';
import * as bcrypt from 'bcrypt';
import { PaymentModeEnum } from '@nest-microservices/shared-enum';
import path from 'path';
import { ConfigService } from '@nestjs/config';
import Mail from 'nodemailer/lib/mailer';

const refundTemplate = path.resolve(
  __dirname,
  './templates/refundNotification.template.ejs'
);

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService
  ) {}
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  private async sendVerificationEmail(
    email: string,
    name: string,
    queueData: object,
    links: object,
    companyInfo: object
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>('EMAIL_USERNAME'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });

    const companyName = this.configService.get<string>('COMPANY_NAME');
    const html = await ejs.renderFile(refundTemplate, {
      companyName,
      customer: { name: name },
      queueData,
      links,
      companyInfo,
    });

    const options: Mail.Options = {
      from: this.configService.get<string>('EMAIL_USERNAME'),
      to: email,
      subject: 'Refund notification',
      text: 'Refund notification',
      html: html,
    };

    await transporter.sendMail(options);

    transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP verification failed:', error);
      } else {
        this.logger.log('SMTP server is ready to take messages');
      }
    });
  }

  private checkRequester = async (
    id: string,
    requesterId: string
  ): Promise<User> => {
    const checkUser = await this.userRepository.getById(requesterId);
    if (!checkUser) {
      throw new RpcException({
        code: HttpStatus.BAD_REQUEST,
        message: 'Requester not found',
        location: 'UserService',
      });
    }

    if (id !== requesterId && checkUser.role !== RoleEnum.ADMIN) {
      throw new RpcException({
        code: HttpStatus.BAD_REQUEST,
        message: 'You are not allowed to perform this action',
        location: 'UserService',
      });
    }

    return checkUser;
  };

  findUsers = async (): Promise<User[]> => {
    const users = await this.userRepository.getAll();
    return users;
  };

  findUsersWithPagination = async (
    query: IQuery
  ): Promise<IPaginatedResponse> => {
    const data = await this.userRepository.getAllWithPagination(
      query.page,
      query.size,
      query.search,
      query.searchField,
      query.order,
      query.sortBy,
      query.options
    );

    return data;
  };

  findUser = async (id: string, requesterId: string): Promise<User> => {
    await this.checkRequester(id, requesterId);

    const user = await this.userRepository.getById(id);
    return user;
  };

  update = async (
    id: string,
    requesterId: string,
    name?: string,
    birthDate?: string,
    hobby?: string,
    email?: string,
    password?: string,
    oldPassword?: string,
    role?: string
  ): Promise<User | null> => {
    const requester = await this.checkRequester(id, requesterId);
    const user = await this.userRepository.getById(id);
    if (!user) {
      throw new RpcException({
        code: HttpStatus.BAD_REQUEST,
        message: 'User not found',
        location: 'UserService',
      });
    }

    let updateData = {};

    if (name) updateData = { ...updateData, name };
    if (birthDate && new Date(birthDate) < new Date())
      updateData = { ...updateData, birthDate: new Date(birthDate) };
    if (hobby) updateData = { ...updateData, hobby };
    if (email) {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new RpcException({
          code: HttpStatus.BAD_REQUEST,
          message: 'Email already exists',
          location: 'UserService',
        });
      }

      updateData = { ...updateData, email, isVerify: false };
    }
    if (password) {
      const isValid = await bcrypt.compare(oldPassword, user.password);

      //check password
      if (!isValid) {
        throw new RpcException({
          code: HttpStatus.BAD_REQUEST,
          message: 'Incorrect old password',
          location: 'UserService',
        });
      }

      //rehash new password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      updateData = { ...updateData, password: hashedPassword };
    }

    if (role && requester.role !== RoleEnum.ADMIN) {
      throw new RpcException({
        code: HttpStatus.BAD_REQUEST,
        message: 'You are not allowed to perform this action',
        location: 'UserService',
      });
    }

    await this.userRepository.updateById(id, updateData);
    const updatedUser = await this.userRepository.getById(id);

    if (!updatedUser) {
      throw new RpcException({
        code: HttpStatus.BAD_REQUEST,
        message: 'User not found',
        location: 'UserService',
      });
    }

    return updatedUser;
  };

  deleteUser = async (id: string, requesterId: string): Promise<boolean> => {
    await this.checkRequester(id, requesterId);

    const user = await this.userRepository.getById(id);
    if (!user) {
      throw new RpcException({
        code: HttpStatus.BAD_REQUEST,
        message: 'User not found',
        location: 'UserService',
      });
    }

    await this.userRepository.deleteById(id);
    return true;
  };

  updateUserBalance = async (
    id: string,
    amount: number,
    mode: string,
    queueData?: object
  ): Promise<User> => {
    const user = await this.userRepository.getById(id);
    if (!user) {
      throw new RpcException({
        code: HttpStatus.NOT_FOUND,
        message: 'User not found',
        location: 'UserService',
      });
    }

    let newBalance;
    switch (mode) {
      case PaymentModeEnum.CHECKOUT:
        if (Number(user.refundBalance) < amount) {
          throw new RpcException({
            code: HttpStatus.BAD_REQUEST,
            message: 'Insufficient balance',
            location: 'UserService',
          });
        }

        newBalance = Number(user.refundBalance) - amount;
        break;

      case PaymentModeEnum.REFUND:
        if (queueData) {
          const links = {
            shop: this.configService.get<string>('SHOP_URL'),
            accountBalance: this.configService.get<string>(
              'ACCOUNT_BALANCE_URL'
            ),
            support: this.configService.get<string>('SUPPORT_URL'),
          };

          const companyInfo = {
            email: this.configService.get<string>('EMAIL_USERNAME'),
            phone: this.configService.get<string>('PHONE_NUMBER'),
            supportHours: this.configService.get<string>('SUPPORT_HOURS'),
          };

          await this.sendVerificationEmail(
            user.email,
            user.name,
            queueData,
            links,
            companyInfo
          );
        }
        newBalance = Number(user.refundBalance) + amount;
        break;

      default:
        break;
    }

    return await this.userRepository.updateById(id, {
      refundBalance: newBalance,
    });
  };
}
