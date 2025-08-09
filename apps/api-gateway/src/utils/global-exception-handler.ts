import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';
import { errorHandler } from '../utils/error-handler';

@Catch(RpcException) // Only catch RpcExceptions (mainly from guards)
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    this.logger.debug(
      `Processing RpcException from guard: ${JSON.stringify(
        exception.getError()
      )}`
    );

    try {
      // Extract the error object from RpcException
      const errorToHandle = exception.getError();

      // Use your existing errorHandler to process the RPC exception
      errorHandler(
        errorToHandle,
        'GlobalExceptionFilter',
        'Authentication/Authorization error'
      );
    } catch (handledException) {
      // errorHandler throws HttpException, send it as response
      if (handledException instanceof HttpException) {
        const errorResponse = handledException.getResponse();
        const statusCode = handledException.getStatus();

        response.status(statusCode).json(errorResponse);
      } else {
        // Fallback for any unexpected error format
        this.logger.error(
          'Unexpected error in GlobalExceptionFilter',
          handledException
        );
        response.status(500).json({
          code: 500,
          message: 'Internal server error',
          location: 'GlobalExceptionFilter',
          path: request.url,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
}
