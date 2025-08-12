import { ClientsModuleOptions, Transport } from '@nestjs/microservices';

// Define service names
export const MICROSERVICE_CLIENTS = {
  AUTH_SERVICE: 'AUTH_SERVICE',
  USER_SERVICE: 'USER_SERVICE',
  PAYMENT_SERVICE: 'PAYMENT_SERVICE',
} as const;

// Main configuration array
export const MicroserviceClients: ClientsModuleOptions = [
  {
    name: MICROSERVICE_CLIENTS.AUTH_SERVICE,
    transport: Transport.TCP,
    options: {
      host: process.env.AUTH_SERVICE_HOST || 'localhost',
      port: Number(process.env.AUTH_SERVICE_PORT) || 3001,
    },
  },
  {
    name: MICROSERVICE_CLIENTS.USER_SERVICE,
    transport: Transport.TCP,
    options: {
      host: process.env.USER_SERVICE_HOST || 'localhost',
      port: Number(process.env.USER_SERVICE_PORT) || 3002,
    },
  },
  {
    name: MICROSERVICE_CLIENTS.PAYMENT_SERVICE,
    transport: Transport.TCP,
    options: {
      host: process.env.PAYMENT_SERVICE_HOST || 'localhost',
      port: Number(process.env.PAYMENT_SERVICE_PORT) || 3003,
    },
  },
];

export const ClientConfigsMap: Record<string, any> = {};
(MicroserviceClients as any[]).forEach((client) => {
  ClientConfigsMap[client.name as string] = client;
});

export const getClientByName = (name: string) => {
  const client = ClientConfigsMap[name];
  if (!client) {
    throw new Error(`Client configuration not found for ${name}`);
  }
  return client;
};
