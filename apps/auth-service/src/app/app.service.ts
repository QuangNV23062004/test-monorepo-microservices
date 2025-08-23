import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import ejs from 'ejs';
import * as bcrypt from 'bcrypt';
import { RoleEnum } from '@nest-microservices/shared-guards';
import { RpcException } from '@nestjs/microservices';
import { User } from '@prisma/client';
const verificationTemplate = path.resolve(
  __dirname,
  './template/verificationEmail.ejs'
);

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  register = async (
    email: string,
    name: string,
    birthDate: Date,
    hobby: string,
    password: string,
    redirectUrl: string
  ): Promise<{ message: string }> => {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new RpcException({
        message: 'Email already taken',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }

    const payload = {
      email,
      name,
      birthDate: new Date(birthDate),
      hobby,
      password,
    };
    const secret = this.configService.get<string>('VERIFICATION_SECRET');
    const expires = this.configService.get<string>('VERIFICATION_EXPIRES_IN');
    const token = this.generateToken(payload, secret, expires);

    const url = `${redirectUrl}?token=${token}`;

    await this.sendVerificationEmail(email, url);

    return { message: 'Verification email sent successfully' };
  };

  private generateToken(
    payload: object,
    secret: string,
    expiresIn: string
  ): string {
    return this.jwtService.sign(payload, {
      secret: secret,
      expiresIn: expiresIn,
    });
  }

  private async sendVerificationEmail(
    email: string,
    verificationUrl: string
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

    const html = await ejs.renderFile(verificationTemplate, {
      verificationUrl,
    });

    const options: Mail.Options = {
      from: this.configService.get<string>('EMAIL_USERNAME'),
      to: email,
      subject: 'Email verification',
      text: 'Email verification',
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

  login = async (
    email: string,
    password: string
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new RpcException({
        message: 'Incorrect credentials',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }
    if (user.isVerify === false) {
      throw new RpcException({
        message: 'User has not been verified',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new RpcException({
        message: 'Incorrect credentials',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }

    const payload = { userId: user.id, role: user.role };
    const accessSecret = this.configService.get<string>('ACCESS_SECRET');
    const accessExpires = this.configService.get<string>('ACCESS_EXPIRES_IN');
    const accessToken = this.generateToken(
      payload,
      accessSecret,
      accessExpires
    );

    const refreshSecret = this.configService.get<string>('REFRESH_SECRET');
    const refreshExpires = this.configService.get<string>('REFRESH_EXPIRES_IN');

    const refreshToken = this.generateToken(
      payload,
      refreshSecret,
      refreshExpires
    );

    return { accessToken, refreshToken };
  };

  reverifyEmail = async (email: string, redirectUrl: string) => {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new RpcException({
        message: 'User not found',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }

    if (user.isVerify) {
      throw new RpcException({
        message: 'User has already been verified',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }

    const payload = { email };
    const secret = this.configService.get<string>('VERIFICATION_SECRET');
    const expires = this.configService.get<string>('VERIFICATION_EXPIRES_IN');
    const token = this.generateToken(payload, secret, expires);

    const url = `${redirectUrl}?token=${token}`;

    await this.sendVerificationEmail(email, url);

    return { message: 'Verification email sent successfully' };
  };

  confirmEmailToken = async (token: string) => {
    const payload = await this.jwtService.verify(token, {
      secret: this.configService.get<string>('VERIFICATION_SECRET'),
    });

    // Create the user in database after successful verification
    let user = await this.userRepository.findByEmail(payload.email);
    if (!user) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(payload.password, salt);

      const countSystemUsers = await this.userRepository.getAllWithPagination(
        1,
        1
      );

      //ensure first user is admin
      let userRole = RoleEnum.USER;
      if (countSystemUsers.data.length === 0) {
        userRole = RoleEnum.ADMIN;
      }
      user = await this.userRepository.create({
        email: payload.email,
        name: payload.name,
        birthDate: payload.birthDate,
        hobby: payload.hobby,
        password: hashedPassword,
        role: userRole,
      });
    } else if (user && user.isVerify === false) {
      await this.userRepository.updateById(user.id, {
        isVerify: true,
      });
    }

    return { message: 'Email verified successfully', userId: user.id };
  };

  verifyAccessToken = async (
    token: string
  ): Promise<{ userId: string; role: string }> => {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get<string>('ACCESS_SECRET'),
      });

      if (!payload.userId || !payload.role) {
        throw new RpcException({
          message: 'Invalid access token',
          code: HttpStatus.BAD_REQUEST,
          location: 'AuthService',
        });
      }

      return payload;
    } catch {
      throw new RpcException({
        message: 'Invalid access token or token has expires',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }
  };

  renewAccessTokenAndRefreshToken = async (
    token: string
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    let payload;
    try {
      payload = await this.jwtService.verify(token, {
        secret: this.configService.get<string>('REFRESH_SECRET'),
      });
    } catch (error) {
      throw new RpcException({
        message: 'Invalid refresh token or token has expires',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }

    if (!payload.userId || !payload.role) {
      throw new RpcException({
        message: 'Invalid refresh token',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }

    const user = await this.userRepository.getById(payload.userId);
    if (!user) {
      throw new RpcException({
        message: 'User not found or has been deleted',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }

    const newPayload = { id: user.id, role: user.role };
    const accessSecret = this.configService.get<string>('ACCESS_SECRET');
    const accessExpires = this.configService.get<string>('ACCESS_EXPIRES_IN');
    const accessToken = this.generateToken(
      newPayload,
      accessSecret,
      accessExpires
    );

    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = payload.exp - currentTime;
    const refreshThreshold = this.configService.get<number>(
      'REFRESH_TOKEN_THRESHOLD',
      24 * 60 * 60
    );
    let returnRefreshToken = token;
    if (remainingTime < refreshThreshold) {
      const refreshSecret = this.configService.get<string>('REFRESH_SECRET');
      const refreshExpires =
        this.configService.get<string>('REFRESH_EXPIRES_IN');

      const refreshToken = this.generateToken(
        newPayload,
        refreshSecret,
        refreshExpires
      );
      returnRefreshToken = refreshToken;
    }
    return { accessToken: accessToken, refreshToken: returnRefreshToken };
  };

  getUserByAccessToken = async (token: string): Promise<User | null> => {
    let payload;
    try {
      payload = await this.jwtService.verify(token, {
        secret: this.configService.get<string>('ACCESS_SECRET'),
      });
    } catch {
      throw new RpcException({
        message: 'Invalid access token or token has expires',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }

    if (!payload.userId || !payload.role) {
      throw new RpcException({
        message: 'Invalid access token',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }

    const user = await this.userRepository.getById(payload.userId);
    if (!user) {
      throw new RpcException({
        message: 'User not found or has been deleted',
        code: HttpStatus.BAD_REQUEST,
        location: 'AuthService',
      });
    }

    return user;
  };
}
