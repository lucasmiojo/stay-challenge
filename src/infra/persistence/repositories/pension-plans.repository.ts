import { PensionPlan } from 'src/domain/entities/pension-plan';
import { pgPool } from '../database/postgres/postgres.client';
import { PensionPlanFactory } from '../../../domain/factories/pension-plan.factory';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PensionPlansRepository {
  async findByUserIdAndContractNumber(
    userId: string,
    contractNumber: string,
  ): Promise<PensionPlan | null> {
    const planResult = await pgPool.query(
      `SELECT * FROM pension_plans WHERE user_id = $1 AND contract_number = $2 LIMIT 1`,
      [userId, contractNumber],
    );

    if (planResult.rowCount === 0) return null;

    const planRow = planResult.rows[0];

    const [contributionsResult, withdrawalsResult] = await Promise.all([
      pgPool.query(`SELECT * FROM contributions WHERE pension_plan_id = $1`, [
        planRow.id,
      ]),
      pgPool.query(`SELECT * FROM withdrawals WHERE pension_plan_id = $1`, [
        planRow.id,
      ]),
    ]);

    const rowWithRelations = {
      ...planRow,
      contributions: contributionsResult.rows,
      withdrawals: withdrawalsResult.rows,
    };

    return PensionPlanFactory.createFromDb(rowWithRelations);
  }
}
