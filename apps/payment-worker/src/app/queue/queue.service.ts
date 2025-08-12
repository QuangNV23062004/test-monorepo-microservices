import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { closeConnection, createConnection } from '../../utils/queue.utils';
import { RpcException } from '@nestjs/microservices';

const logger = new Logger('PaymentWorker - QueueService');
const PAYMENT_QUEUE_NAME = 'Payment_queue';

@Injectable()
export class QueueService {
  private connection: any;
  private channel: any;

  async consumePaymentData(
    callback: (data: any) => Promise<void>
  ): Promise<void> {
    logger.log('Starting to consume payment queue...');

    try {
      const { connection, channel } = await createConnection();
      this.connection = connection;
      this.channel = channel;

      await channel.assertQueue(PAYMENT_QUEUE_NAME, { durable: true });
      await channel.prefetch(1);

      // Add log for queue status
      const queueStatus = await channel.checkQueue(PAYMENT_QUEUE_NAME);
      logger.log(
        `Connected to queue: ${PAYMENT_QUEUE_NAME}. Messages waiting: ${queueStatus.messageCount}`
      );

      await channel.consume(
        PAYMENT_QUEUE_NAME,
        async (msg) => {
          if (msg) {
            try {
              const data = JSON.parse(msg.content.toString());

              // Enhanced logging with queue data
              logger.log(
                `[${new Date().toISOString()}] FETCHED from queue - Transaction: ${
                  data.transactionId
                }`
              );
              logger.debug('Full queue data:', {
                ...data,
              });

              await callback(data);
              channel.ack(msg);
              logger.log(`✅ Processed: ${data.transactionId}`);
            } catch (error) {
              logger.error(`❌ Processing failed: ${error.message}`);
              channel.nack(msg, false, false);
            }
          }
        },
        { noAck: false }
      );

      logger.log('🚀 Worker actively listening for queue messages...');
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Queue connection failed:', error);
      // Add automatic reconnection
      setTimeout(() => {
        logger.warn('Attempting to reconnect to queue...');
        this.consumePaymentData(callback);
      }, 5000);
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async () => {
      logger.log('Closing queue connection...');
      if (this.connection && this.channel) {
        await closeConnection(this.connection, this.channel);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}
