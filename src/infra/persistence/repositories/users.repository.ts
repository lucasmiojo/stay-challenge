import { Injectable } from '@nestjs/common';
import { pgPool } from '../database/postgres/postgres.client';

@Injectable()
export class UsersRepository {
  async findByCpf(cpf: string) {
    const query = `SELECT * FROM users WHERE cpf = $1`;
    const result = await pgPool.query(query, [cpf]);
    return result.rows[0] || null;
  }
}
