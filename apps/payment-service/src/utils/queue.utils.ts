import { Logger } from '@nestjs/common';

import amqp, { Channel, Connection } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();
const RABBITMQ_URL = process.env.RABBITMQ_URL;

const logger = new Logger('QueueUtils');
const createConnection = async (): Promise<{
  connection: Connection;
  channel: Channel;
}> => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL as string);
    const channel = await connection.createChannel();
    return { connection, channel };
  } catch (error) {
    logger.error(error instanceof Error ? error.message : error);

    throw error;
  }
};

const closeConnection = async (connection: Connection, channel: Channel) => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : error);

    throw error;
  }
};
export { createConnection, closeConnection };
