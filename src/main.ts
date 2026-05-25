import { NestFactory } from '@nestjs/core';

import { NestExpressApplication } from '@nestjs/platform-express';

import { join } from 'path';

import { configure } from 'nunjucks';

import { AppModule } from './app.module';

const DEFAULT_PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const basePath = process.env.BASE_PATH ? `/${process.env.BASE_PATH}` : '';

  const nunjucksEnv = configure(join(process.cwd(), 'src', '.views'), {
    autoescape: true,
    express: app,
    watch: true
  });

  nunjucksEnv.addGlobal('basePath', basePath);
  nunjucksEnv.addGlobal('rand', Date.now());

  app.setViewEngine('njk');

  /** @note ~ static assets */
  app.useStaticAssets(join(process.cwd(), 'src', '.public'), {});
  app.setGlobalPrefix(process.env.BASE_PATH || '');

  await app.listen(process.env.SERVER_PORT || DEFAULT_PORT);

  console.log(
    `🚀 Server is running on http://localhost:${process.env.SERVER_PORT ?? DEFAULT_PORT}/${process.env.BASE_PATH ?? ''}`
  );
}

void bootstrap();
