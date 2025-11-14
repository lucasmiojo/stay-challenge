import { PensionPlan } from '../../../../domain/entities/pension-plan';
import { Money } from '../../../../domain/value-objects/money';
import { Contributions } from '../../../../domain/entities/contributions';
import { Withdrawals } from '../../../../domain/entities/withdrawal';
import { Balance } from '../../../../domain/value-objects/balance';
import { Grace } from '../../../../domain/value-objects/grace';
import { TaxationStrategyFactory } from '../../../../domain/value-objects/taxation/taxation-factory';

describe('PensionPlan Entity', () => {
  let now: Date;
  let pastDate: Date;
  let futureDate: Date;

  beforeEach(() => {
    now = new Date();
    pastDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10);
    futureDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10);
  });

  it('should create a PensionPlan instance with valid properties', () => {
    const contributions: Contributions[] = [];
    const withdrawals: Withdrawals[] = [];
    const plan = new PensionPlan({
      id: 'plan-1',
      type: 'PGBL',
      contractNumber: '123456',
      startDate: now,
      contributions,
      withdrawals,
    });

    expect(plan.id).toBe('plan-1');
    expect(plan.type).toBe('PGBL');
    expect(plan.contractNumber).toBe('123456');
    expect(plan.startDate).toBe(now);
    expect(plan.contributions).toEqual([]);
    expect(plan.withdrawals).toEqual([]);
  });

  it('should return yield rate as 0.2', () => {
    const plan = new PensionPlan({
      id: '1',
      type: 'VGBL',
      contractNumber: 'C123',
      startDate: now,
      contributions: [],
      withdrawals: [],
    });

    expect(plan.getYieldRate()).toBe(0.2);
  });

  it('should return the correct taxation strategy instance for each plan type', () => {
    const pgblPlan = new PensionPlan({
      id: '1',
      type: 'PGBL',
      contractNumber: 'C1',
      startDate: now,
      contributions: [],
      withdrawals: [],
    });

    const vgblPlan = new PensionPlan({
      id: '2',
      type: 'VGBL',
      contractNumber: 'C2',
      startDate: now,
      contributions: [],
      withdrawals: [],
    });

    const pgblTax = pgblPlan.getTaxation();
    const vgblTax = vgblPlan.getTaxation();

    expect(pgblTax).toBeInstanceOf(
      TaxationStrategyFactory.create('PGBL').constructor,
    );
    expect(vgblTax).toBeInstanceOf(
      TaxationStrategyFactory.create('VGBL').constructor,
    );
  });

  it('should calculate balance correctly with mixed contributions and withdrawals', () => {
    const contrib1 = new Contributions({
      id: 'c1',
      money: new Money(10000), // R$100
      startDate: pastDate,
      availabilityDate: pastDate,
    });

    const contrib2 = new Contributions({
      id: 'c2',
      money: new Money(20000), // R$200
      startDate: pastDate,
      availabilityDate: futureDate,
    });

    const withdrawalConfirmed = new Withdrawals({
      id: 'w1',
      transactionId: 't1',
      pensionPlanId: 'p1',
      requestedValue: new Money(5000), // R$50
      redeemableValue: new Money(5000),
      requestDate: pastDate,
      status: 'CONFIRMED',
      confirmationDate: now,
    });

    const plan = new PensionPlan({
      id: 'p1',
      type: 'PGBL',
      contractNumber: 'C100',
      startDate: now,
      contributions: [contrib1, contrib2],
      withdrawals: [withdrawalConfirmed],
    });

    const result: Balance = plan.calculateBalance();

    expect(result).toBeInstanceOf(Balance);
    expect(result.total.amount).toBe(31000);
    expect(result.available.amount).toBe(5000);
    expect(result.notAvailable.amount).toBe(24000);
    expect(result.grace[0]).toBeInstanceOf(Grace);
    expect(result.grace[0].money.amount).toBe(24000);
  });

  it('should handle case when no withdrawals are confirmed', () => {
    const contrib = new Contributions({
      id: 'c1',
      money: new Money(10000),
      startDate: pastDate,
      availabilityDate: pastDate,
    });

    const plan = new PensionPlan({
      id: 'p1',
      type: 'PGBL',
      contractNumber: 'C100',
      startDate: now,
      contributions: [contrib],
      withdrawals: [],
    });

    const result = plan.calculateBalance();

    // yield = +20%, total = 12000
    expect(result.total.amount).toBe(12000);
    expect(result.available.amount).toBe(10000);
    expect(result.notAvailable.amount).toBe(0);
    expect(result.grace).toHaveLength(0);
  });

  it('should handle when all contributions are unavailable', () => {
    const contrib = new Contributions({
      id: 'c1',
      money: new Money(15000),
      startDate: pastDate,
      availabilityDate: futureDate,
    });

    const plan = new PensionPlan({
      id: 'p1',
      type: 'VGBL',
      contractNumber: 'C200',
      startDate: now,
      contributions: [contrib],
      withdrawals: [],
    });

    const result = plan.calculateBalance();

    // total com yield = 15000 * 1.2 = 18000
    // todos indisponiveis
    expect(result.total.amount).toBe(18000);
    expect(result.available.amount).toBe(0);
    expect(result.notAvailable.amount).toBe(18000);
    expect(result.grace[0]).toBeInstanceOf(Grace);
  });
});
