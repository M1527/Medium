import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from './app.module';
import { DEFAULT_PORT } from './common/constants/app.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new I18nValidationExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Medium Clone API')
    .setDescription('Backend API for Medium clone')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;
  await app.listen(port);
}
bootstrap();
