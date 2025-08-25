/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './utils/global-exception-handler';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'], // Enable debug logging
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Add middleware for form-encoded data (needed for PayPal IPN)
  app.use(express.urlencoded({ extended: true }));

  // Enhanced CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || [
      'http://localhost:3000',
      'http://localhost:4200',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['set-cookie'],
  });

  const port = process.env.PORT || 3000;
  const logger = new Logger('ApiGateway');

  try {
    // Setup Swagger documentation with multiple auth options
    const config = new DocumentBuilder()
      .setTitle('API Gateway')
      .setDescription('API documentation for the API Gateway service')
      .setVersion('3.0')
      .addServer(`http://localhost:${port}`, 'Development server')
      // Try different Bearer auth configurations
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'bearer'
      )
      // Cookie auth
      .addCookieAuth(
        'accessToken',
        {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT token stored in cookie',
        },
        'cookie-auth'
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    document.security = [{ bearer: [] }, { 'cookie-auth': [] }];
    // Enhanced Swagger setup
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        tryItOutEnabled: true,
      },
      customSiteTitle: 'API Gateway Documentation',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .scheme-container { 
          background: #fafafa; 
          padding: 10px; 
          border-radius: 4px;
          margin: 20px 0;
        }
      `,
    });

    logger.log('✅ Swagger documentation setup completed');
  } catch (error) {
    logger.error('❌ Failed to setup Swagger documentation:', error);
  }

  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(port);

  logger.log(
    `🚀 ApiGateway is running on: http://localhost:${port}/${globalPrefix}`
  );

  logger.log(
    `📚 Swagger documentation available at: http://localhost:${port}/api-docs`
  );
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
