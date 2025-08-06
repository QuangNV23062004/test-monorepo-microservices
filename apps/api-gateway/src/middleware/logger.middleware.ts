import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('ApiGateway');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const ms = Date.now() - start;

      const statusColor =
        res.statusCode >= 500
          ? '\x1b[31m' // red
          : res.statusCode >= 400
          ? '\x1b[33m' // yellow
          : res.statusCode >= 300
          ? '\x1b[36m' // cyan
          : '\x1b[32m'; // green

      const reset = '\x1b[0m';

      this.logger.log(
        `[${method}] ${originalUrl} ${statusColor}${res.statusCode}${reset} (${ms}ms)`
      );
    });

    next();
  }
}
