import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
<<<<<<< HEAD
=======
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:5173',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían propiedades extras
      transform: true, // Transforma el payload al tipo del DTO
    }),
  );
<<<<<<< HEAD
=======

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Transport API')
    .setDescription('Documentación de la API de transporte')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
