import { PensionPlansRepository } from '../../../../../infra/persistence/repositories/pension-plans.repository';
import { pgPool } from '../../../../../infra/persistence/database/postgres/postgres.client';
import { PensionPlanFactory } from '../../../../../domain/factories/pension-plan.factory';
import { PensionPlan } from '../../../../../domain/entities/pension-plan';

jest.mock(
  '../../../../../infra/persistence/database/postgres/postgres.client',
  () => ({
    pgPool: { query: jest.fn() },
  }),
);

jest.mock('../../../../../domain/factories/pension-plan.factory', () => ({
  PensionPlanFactory: { createFromDb: jest.fn() },
}));

describe('PensionPlansRepository', () => {
  let repository: PensionPlansRepository;

  beforeEach(() => {
    repository = new PensionPlansRepository();
    jest.clearAllMocks();
  });

  it('should return null if no plan found', async () => {
    (pgPool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });

    const result = await repository.findByUserIdAndContractNumber(
      'user-1',
      'CN123',
    );
    expect(result).toBeNull();
  });

  it('should return PensionPlan entity when found', async () => {
    const fakePlanRow = { id: 'plan-1', type: 'PGBL' };
    const fakeContributions = [{ id: 'c1', value: 100 }];
    const fakeWithdrawals = [{ id: 'w1', requested_value: 50 }];
    const fakeEntity = new PensionPlan(fakePlanRow as any);

    // Simula retorno das queries
    (pgPool.query as jest.Mock)
      .mockResolvedValueOnce({ rowCount: 1, rows: [fakePlanRow] })
      .mockResolvedValueOnce({ rows: fakeContributions })
      .mockResolvedValueOnce({ rows: fakeWithdrawals });

    (PensionPlanFactory.createFromDb as jest.Mock).mockReturnValue(fakeEntity);

    const result = await repository.findByUserIdAndContractNumber(
      'user-1',
      'CN123',
    );

    expect(pgPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM pension_plans'),
      ['user-1', 'CN123'],
    );

    expect(pgPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM contributions'),
      [fakePlanRow.id],
    );

    expect(pgPool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM withdrawals'),
      [fakePlanRow.id],
    );

    expect(PensionPlanFactory.createFromDb).toHaveBeenCalledWith(
      expect.objectContaining({
        ...fakePlanRow,
        contributions: fakeContributions,
        withdrawals: fakeWithdrawals,
      }),
    );

    expect(result).toBe(fakeEntity);
  });
});
