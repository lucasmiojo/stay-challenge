import { seedDatabase } from '../seed/seed.db';
import { TABLES_SQL } from '../seed/tables.db';
import { pgPool } from './postgres.client';

export async function initDatabase() {
  try {
    await pgPool.query(TABLES_SQL);
    console.log('Tables verified/created');

    await seedDatabase();

    console.log('Seed applied');
  } catch (err) {
    console.error('Error when initializing database:', err);
  }
}
