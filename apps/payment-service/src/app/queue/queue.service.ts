import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { closeConnection, createConnection } from '../../utils/queue.utils';
import { RpcException } from '@nestjs/microservices';

const logger = new Logger('PaymentService - QueueService');
const PAYMENT_QUEUE_NAME = 'Payment_queue';

@Injectable()
export class QueueService {
  sendDataToQueue = async (data: object) => {
    logger.debug('Sending queue data: ', data);
    const { connection, channel } = await createConnection();
    try {
      await channel.assertQueue(PAYMENT_QUEUE_NAME, { durable: true });
      channel.sendToQueue(
        PAYMENT_QUEUE_NAME,
        Buffer.from(JSON.stringify(data))
      );
    } catch (error) {
      logger.error(
        `Error sending data to queue: ${
          error instanceof Error ? error.message : error
        }`
      );
      throw new RpcException({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error sending data to queue: ${
          error instanceof Error ? error.message : error
        }`,
        location: 'QueueService',
      });
    } finally {
      await closeConnection(connection, channel);
    }
  };
}
