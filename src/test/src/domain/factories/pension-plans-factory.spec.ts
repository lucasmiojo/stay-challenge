import { PensionPlanFactory } from '../../../../domain/factories/pension-plan.factory';
import { PensionPlan } from '../../../../domain/entities/pension-plan';
import { Contributions } from '../../../../domain/entities/contributions';
import { Withdrawals } from '../../../../domain/entities/withdrawal';
import { Money } from '../../../../domain/value-objects/money';

describe('PensionPlanFactory', () => {
  it('should create a PensionPlan from DB row with contributions and withdrawals', () => {
    const row = {
      id: 'plan-1',
      type: 'PGBL',
      contract_number: 'CN123',
      start_date: '2024-01-01T00:00:00.000Z',
      contributions: [
        {
          id: 'c1',
          value: 1000,
          start_date: '2024-01-01T00:00:00.000Z',
          availability_date: '2025-01-01T00:00:00.000Z',
        },
      ],
      withdrawals: [
        {
          id: 'w1',
          transaction_id: 'tx123',
          pension_plan_id: 'plan-1',
          requested_value: 500,
          redeemable_value: 400,
          request_date: new Date('2024-06-01'),
          status: 'CONFIRMED',
          confirmation_date: new Date('2024-06-05'),
          rejection_reason: null,
        },
      ],
    };

    const plan = PensionPlanFactory.createFromDb(row);

    expect(plan).toBeInstanceOf(PensionPlan);
    expect(plan.id).toBe('plan-1');
    expect(plan.type).toBe('PGBL');
    expect(plan.contractNumber).toBe('CN123');
    expect(plan.startDate).toBeInstanceOf(Date);

    expect(plan.contributions).toHaveLength(1);
    expect(plan.contributions[0]).toBeInstanceOf(Contributions);
    expect(plan.contributions[0].money).toBeInstanceOf(Money);
    expect(plan.contributions[0].money.amount).toBe(1000);

    expect(plan.withdrawals).toHaveLength(1);
    expect(plan.withdrawals[0]).toBeInstanceOf(Withdrawals);
    expect(plan.withdrawals[0].requestedValue.amount).toBe(500);
    expect(plan.withdrawals[0].redeemableValue.amount).toBe(400);
  });

  it('should create a PensionPlan with empty arrays when no contributions or withdrawals are provided', () => {
    const row = {
      id: 'plan-2',
      type: 'VGBL',
      contract_number: 'CN999',
      start_date: '2024-03-10T00:00:00.000Z',
      contributions: undefined,
      withdrawals: undefined,
    };

    const plan = PensionPlanFactory.createFromDb(row);

    expect(plan).toBeInstanceOf(PensionPlan);
    expect(plan.contributions).toEqual([]);
    expect(plan.withdrawals).toEqual([]);
  });
});
