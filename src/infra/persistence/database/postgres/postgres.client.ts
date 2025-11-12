import { Pool } from 'pg';

export const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'adminuser',
  password: process.env.POSTGRES_PASSWORD || 'newpassword',
  database: process.env.POSTGRES_DB || 'pensions',
});

export async function connectPostgres(retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pgPool.connect();
      console.log('Postgres connected!');
      return;
    } catch (err) {
      console.log(`Try ${i + 1} failed, trying again in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      console.error('It wasnt posible to connect to Postgres. Err: ', err);
    }
  }
}
