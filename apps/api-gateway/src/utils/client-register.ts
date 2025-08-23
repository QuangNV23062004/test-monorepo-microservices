import { getClient } from '@nest-microservices/shared-utils';
import { ClientsModuleOptions, Transport } from '@nestjs/microservices';

// Define service names
export const MICROSERVICE_CLIENTS = {
  AUTH_SERVICE: 'AUTH_SERVICE',
  USER_SERVICE: 'USER_SERVICE',
  PAYMENT_SERVICE: 'PAYMENT_SERVICE',
  RECEIPT_SERVICE: 'RECEIPT_SERVICE',
  ORDER_SERVICE: 'ORDER_SERVICE',
  PRODUCT_SERVICE: 'PRODUCT_SERVICE',
} as const;

// Main configuration array
export const MicroserviceClients: ClientsModuleOptions = [
  getClient(
    MICROSERVICE_CLIENTS.AUTH_SERVICE,
    Transport.TCP,
    process.env.AUTH_SERVICE_HOST || 'localhost',
    Number(process.env.AUTH_SERVICE_PORT) || 3001
  ),
  getClient(
    MICROSERVICE_CLIENTS.USER_SERVICE,
    Transport.TCP,
    'localhost',
    3002
  ),
  getClient(
    MICROSERVICE_CLIENTS.PAYMENT_SERVICE,
    Transport.TCP,
    'localhost',
    3003
  ),
  getClient(
    MICROSERVICE_CLIENTS.RECEIPT_SERVICE,
    Transport.TCP,
    'localhost',
    3004
  ),
  getClient(
    MICROSERVICE_CLIENTS.ORDER_SERVICE,
    Transport.TCP,
    'localhost',
    3006
  ),
  getClient(
    MICROSERVICE_CLIENTS.PRODUCT_SERVICE,
    Transport.TCP,
    'localhost',
    3007
  ),
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
