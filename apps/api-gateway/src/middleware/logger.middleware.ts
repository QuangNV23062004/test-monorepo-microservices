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

      const methodColor = '\x1b[36m'; // cyan
      const statusColor =
        res.statusCode >= 500
          ? '\x1b[31m'
          : res.statusCode >= 400
          ? '\x1b[33m'
          : res.statusCode >= 300
          ? '\x1b[36m'
          : '\x1b[32m';

      const reset = '\x1b[0m';
      const urlColor = '\x1b[32m'; // green
      const timeColor = '\x1b[33m'; // yellow
      this.logger.log(
        `Method: ${methodColor}[${method}]${reset} ${'\x1b[32m'}URL: ${urlColor}${originalUrl} Status: ${statusColor}${
          res.statusCode
        }${reset} ${timeColor}+${ms}ms`
      );
    });

    next();
  }
}
