import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

const logger = new Logger();
export const getClient = (
  name: string,
  transport: number,
  host: string,
  port: number
) => {
  return {
    name: name,
    transport: transport || Transport.TCP,
    options: {
      host: host || 'localhost',
      port: port,
    },
  };
};
