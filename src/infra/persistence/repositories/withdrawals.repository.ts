import { Withdrawals } from 'src/domain/entities/withdrawal';
import { pgPool } from '../database/postgres/postgres.client';
import { Injectable } from '@nestjs/common';
import { WithdrawalsFactory } from '../../../domain/factories/withdrawals.factory';

@Injectable()
export class WithdrawalsRepository {
  async findByTransactionId(id: string): Promise<Withdrawals[]> {
    const result = await pgPool.query(
      `SELECT * FROM withdrawals WHERE transaction_id = $1`,
      [id],
    );
    return result.rows.map((row) => WithdrawalsFactory.createFromDb(row));
  }

  async createWithdrawal({
    id,
    transactionId,
    pensionPlanId,
    requestedValue,
    redeemableValue,
    requestDate,
    status,
    rejectionReason = '',
  }) {
    const query = `
      INSERT INTO withdrawals (id,
      transaction_id,
      pension_plan_id,
      requested_value,
      redeemable_value,
      request_date,
      status,
      rejection_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      id,
      transactionId,
      pensionPlanId,
      requestedValue,
      redeemableValue,
      requestDate,
      status,
      rejectionReason,
    ];
    const result = await pgPool.query(query, values);
    return WithdrawalsFactory.createFromDb(result.rows[0]);
  }
}
