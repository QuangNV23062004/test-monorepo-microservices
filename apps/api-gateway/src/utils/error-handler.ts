import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

interface MicroserviceError {
  code: number;
  message: string;
  location: string;
  details?: any;
}

export const errorHandler = (
  error: any,
  location: string,
  defaultMessage: string
) => {
  const logger = new Logger(`ApiGateway - ${error.location || location}`);

  // Enhanced logging with full error details for devs/devops
  const logError = (
    errorMessage: string,
    errorCode: number,
    additionalInfo?: any
  ) => {
    logger.error(`❌ [${errorCode}] ${errorMessage}`);

    // Log stack trace if available
    if (error instanceof Error && error.stack) {
      logger.error(`📍 Stack trace: ${error.stack}`);
    }
  };

  // NEW: Handle RpcException instances directly
  if (error instanceof RpcException) {
    const rpcError = error.getError() as MicroserviceError;

    logError(`${defaultMessage}: ${rpcError.message}`, rpcError.code, {
      originalMessage: rpcError.message,
      location: rpcError.location,
      details: rpcError.details,
      source: 'RpcException instance',
    });

    throw new HttpException(
      {
        code: rpcError.code,
        message: rpcError.message,
        location: rpcError.location || location,
        ...(rpcError.details && { details: rpcError.details }),
      },
      rpcError.code
    );
  }

  // Handle RpcException errors from microservices
  if (error && typeof error === 'object') {
    // Case 1: Direct microservice error object
    if (error.code && error.message) {
      const microError = error as MicroserviceError;

      logError(`${defaultMessage}: ${microError.message}`, microError.code, {
        originalMessage: microError.message,
        location: microError.location,
        details: microError.details,
        source: 'Direct microservice error',
      });

      throw new HttpException(
        {
          code: microError.code,
          message: microError.message,
          location: microError.location || location,
          ...(microError.details && { details: microError.details }),
        },
        microError.code
      );
    }

    // Case 2: Nested error (common with RxJS/microservices)
    if (error.error && error.error.code && error.error.message) {
      const nestedError = error.error as MicroserviceError;

      logError(`${defaultMessage}: ${nestedError.message}`, nestedError.code, {
        originalMessage: nestedError.message,
        location: nestedError.location,
        details: nestedError.details,
        source: 'Nested microservice error',
        parentError: error,
      });

      throw new HttpException(
        {
          code: nestedError.code,
          message: nestedError.message,
          location: nestedError.location || location,
          ...(nestedError.details && { details: nestedError.details }),
        },
        nestedError.code
      );
    }

    // Case 3: RPC Exception format
    if (error.details && error.details.code && error.details.message) {
      const rpcError = error.details as MicroserviceError;

      logError(`${defaultMessage}: ${rpcError.message}`, rpcError.code, {
        originalMessage: rpcError.message,
        location: rpcError.location,
        details: rpcError.details,
        source: 'RPC Exception format',
        rpcErrorDetails: error.details,
      });

      throw new HttpException(
        {
          code: rpcError.code,
          message: rpcError.message,
          location: rpcError.location || location,
          ...(rpcError.details && { details: rpcError.details }),
        },
        rpcError.code
      );
    }
  }

  // Case 4: Standard Error object
  if (error instanceof Error) {
    logError(
      `${defaultMessage}: ${error.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        errorName: error.name,
        originalMessage: error.message,
        source: 'Standard Error object',
      }
    );

    throw new HttpException(
      {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
        location: location,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // Case 5: Already an HttpException
  if (error instanceof HttpException) {
    const response = error.getResponse();
    const status = error.getStatus();

    logError(
      `${defaultMessage}: ${
        typeof response === 'string' ? response : JSON.stringify(response)
      }`,
      status,
      {
        httpExceptionResponse: response,
        source: 'Existing HttpException',
      }
    );

    throw error;
  }

  // Case 6: Unknown error format
  const unknownErrorMessage = `${defaultMessage}: Unknown error format`;

  logError(unknownErrorMessage, HttpStatus.INTERNAL_SERVER_ERROR, {
    originalError: error,
    errorType: typeof error,
    source: 'Unknown error format',
  });

  throw new HttpException(
    {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: defaultMessage,
      location: location,
      originalError:
        typeof error === 'object' ? JSON.stringify(error) : String(error),
    },
    HttpStatus.INTERNAL_SERVER_ERROR
  );
};
