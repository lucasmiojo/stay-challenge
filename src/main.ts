import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { connectRedis } from './infra/persistence/database/redis/redis.client';
import { initDatabase } from './infra/persistence/database/postgres';
import { connectPostgres } from './infra/persistence/database/postgres/postgres.client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 5007, '0.0.0.0');
  await connectPostgres();
  await initDatabase();
  await connectRedis();
}
bootstrap();
