import { Withdrawals } from '../entities/withdrawal';
import { Money } from '../value-objects/money';

export class WithdrawalsFactory {
  /**
   * Cria um novo pedido de saque (pendente)
   */
  static createFromDb(row: {
    id: string;
    pension_plan_id: string;
    transaction_id: string;
    requested_value: number;
    redeemable_value: number;
    rejection_reason?: string;
    request_date?: Date;
    status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  }): Withdrawals {
    return new Withdrawals({
      id: row.id,
      transactionId: row.transaction_id,
      pensionPlanId: row.pension_plan_id,
      requestedValue: new Money(row.requested_value),
      redeemableValue: new Money(row.redeemable_value),
      requestDate: row.request_date ?? new Date(),
      status: row.status,
      rejectionReason: row.rejection_reason,
    });
  }
}
