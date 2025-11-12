import { WithdrawalsFactory } from '../../../../domain/factories/withdrawals.factory';
import { Withdrawals } from '../../../../domain/entities/withdrawal';
import { Money } from '../../../../domain/value-objects/money';

describe('WithdrawalsFactory', () => {
  it('should create a Withdrawals entity from DB row', () => {
    const row = {
      id: 'w1',
      pension_plan_id: 'plan-1',
      transaction_id: 'tx-001',
      requested_value: 1000,
      redeemable_value: 850,
      request_date: new Date('2024-06-01'),
      status: 'PENDING' as const,
    };

    const withdrawal = WithdrawalsFactory.createFromDb(row);

    expect(withdrawal).toBeInstanceOf(Withdrawals);
    expect(withdrawal.id).toBe('w1');
    expect(withdrawal.pensionPlanId).toBe('plan-1');
    expect(withdrawal.transactionId).toBe('tx-001');
    expect(withdrawal.requestedValue).toBeInstanceOf(Money);
    expect(withdrawal.requestedValue.amount).toBe(1000);
    expect(withdrawal.redeemableValue.amount).toBe(850);
    expect(withdrawal.status).toBe('PENDING');
  });

  it('should assign current date when request_date is not provided', () => {
    const row = {
      id: 'w2',
      pension_plan_id: 'plan-2',
      transaction_id: 'tx-002',
      requested_value: 2000,
      redeemable_value: 1700,
      status: 'CONFIRMED' as const,
    };

    const before = new Date();
    const withdrawal = WithdrawalsFactory.createFromDb(row);
    const after = new Date();

    expect(withdrawal.requestDate).toBeInstanceOf(Date);
    expect(withdrawal.requestDate.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(withdrawal.requestDate.getTime()).toBeLessThanOrEqual(
      after.getTime(),
    );
  });
});
