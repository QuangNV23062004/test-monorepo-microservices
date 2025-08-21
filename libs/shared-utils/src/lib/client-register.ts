import { Transport } from '@nestjs/microservices';

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
