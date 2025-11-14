import './infra/config/observability/tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { connectRedis } from './infra/persistence/database/redis/redis.client';
import { initDatabase } from './infra/persistence/database/postgres';
import { connectPostgres } from './infra/persistence/database/postgres/postgres.client';
import { LoggingInterceptor } from './common/interceptors/loggin.interceptor';
import { metricsMiddleware } from './infra/config/observability/metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });
  app.useGlobalInterceptors(new LoggingInterceptor());
  await connectPostgres();
  await initDatabase();
  await connectRedis();
  app.use('/metrics', metricsMiddleware);

  await app.listen(process.env.PORT ?? 5007, '0.0.0.0');
}
bootstrap();
