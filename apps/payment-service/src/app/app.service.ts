import { Injectable, Logger } from '@nestjs/common';
import path from 'path';
import ejs from 'ejs';
import fs from 'fs';
import { QueueService } from './queue/queue.service';

const ipnTemplatePath = path.resolve(
  __dirname,
  './templates/paymentIpn.template.ejs'
);
const redirectTemplatePath = path.resolve(
  __dirname,
  './templates/paymentRedirect.template.ejs'
);

@Injectable()
export class AppService {
  constructor(private readonly queueService: QueueService) {}
  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  getIpnTemplate = () => {
    const templateContent = fs.readFileSync(ipnTemplatePath, 'utf8');
    return ejs.render(templateContent);
  };

  handlePlaymentProcess = async (data: object) => {
    const templateContent = fs.readFileSync(redirectTemplatePath, 'utf8');
    try {
      await this.queueService.sendDataToQueue(data);

      return ejs.render(templateContent, {
        success: true,
        data: data,
        message: '',
        frontendUrl: process.env.FRONTEND_URL,
      });
    } catch (error) {
      const logger = new Logger('PaymentService');
      logger.log(
        `Error handling payment redirect template: ${
          error instanceof Error ? error.message : error
        }`
      );
      return ejs.render(templateContent, {
        success: false,
        frontendUrl: process.env.FRONTEND_URL,
      });
    }
  };
}
