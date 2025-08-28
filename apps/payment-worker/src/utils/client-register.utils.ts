import { getClient } from '@nest-microservices/shared-utils';
import { ClientsModuleOptions, Transport } from '@nestjs/microservices';

// Define service names
export const MICROSERVICE_CLIENTS = {
  USER_SERVICE: process.env.USER_SERVICE_NAME || 'USER_SERVICE',
  RECEIPT_SERVICE: process.env.RECEIPT_SERVICE_NAME || 'RECEIPT_SERVICE',
  ORDER_SERVICE: process.env.ORDER_SERVICE_NAME || 'ORDER_SERVICE',
  PRODUCT_SERVICE: process.env.PRODUCT_SERVICE_NAME || 'PRODUCT_SERVICE',
} as const;

// Main configuration array
export const MicroserviceClients: ClientsModuleOptions = [
  getClient(
    MICROSERVICE_CLIENTS.USER_SERVICE,
    Number(process.env.USER_SERVICE_TRANSPORT) || Transport.TCP,
    process.env.USER_SERVICE_HOST || 'localhost',
    Number(process.env.USER_SERVICE_PORT) || 3002
  ),
  getClient(
    MICROSERVICE_CLIENTS.RECEIPT_SERVICE,
    Number(process.env.RECEIPT_SERVICE_TRANSPORT) || Transport.TCP,
    process.env.RECEIPT_SERVICE_HOST || 'localhost',
    Number(process.env.RECEIPT_SERVICE_PORT) || 3004
  ),
  getClient(
    MICROSERVICE_CLIENTS.ORDER_SERVICE,
    Number(process.env.ORDER_SERVICE_TRANSPORT) || Transport.TCP,
    process.env.ORDER_SERVICE_HOST || 'localhost',
    Number(process.env.ORDER_SERVICE_HOST) || 3006
  ),
  getClient(
    MICROSERVICE_CLIENTS.PRODUCT_SERVICE,
    Number(process.env.PRODUCT_SERVICE_TRANSPORT) || Transport.TCP,
    process.env.PRODUCT_SERVICE_HOST || 'localhost',
    Number(process.env.PRODUCT_SERVICE_PORT) || 3007
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
