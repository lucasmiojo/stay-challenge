import { WithdrawalsRepository } from '../../../../../infra/persistence/repositories/withdrawals.repository';
import { pgPool } from '../../../../../infra/persistence/database/postgres/postgres.client';
import { WithdrawalsFactory } from '../../../../../domain/factories/withdrawals.factory';
import { Withdrawals } from '../../../../../domain/entities/withdrawal';
import { Money } from '../../../../../domain/value-objects/money';

jest.mock(
  '../../../../../infra/persistence/database/postgres/postgres.client',
  () => ({
    pgPool: { query: jest.fn() },
  }),
);

jest.mock('../../../../../domain/factories/withdrawals.factory', () => ({
  WithdrawalsFactory: { createFromDb: jest.fn() },
}));

describe('WithdrawalsRepository', () => {
  let repository: WithdrawalsRepository;

  beforeEach(() => {
    repository = new WithdrawalsRepository();
    jest.clearAllMocks();
  });

  describe('findByTransactionId', () => {
    it('should return mapped withdrawals from DB rows', async () => {
      const fakeRow = { id: '1', transaction_id: 'tx-123' };

      const fakeEntity = new Withdrawals({
        id: '1',
        transactionId: 'tx-123',
        pensionPlanId: 'plan-1',
        requestedValue: new Money(1000),
        redeemableValue: new Money(850),
        requestDate: new Date('2024-01-01T00:00:00Z'),
        status: 'PENDING',
        confirmationDate: undefined,
        rejectionReason: undefined,
      });

      (pgPool.query as jest.Mock).mockResolvedValueOnce({ rows: [fakeRow] });
      (WithdrawalsFactory.createFromDb as jest.Mock).mockReturnValueOnce(
        fakeEntity,
      );

      const result = await repository.findByTransactionId('tx-123');

      expect(pgPool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT * FROM withdrawals WHERE transaction_id = $1',
        ),
        ['tx-123'],
      );
      expect(WithdrawalsFactory.createFromDb).toHaveBeenCalledWith(fakeRow);
      expect(result).toEqual([fakeEntity]);
    });

    it('should return empty array if no withdrawals found', async () => {
      (pgPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await repository.findByTransactionId('tx-999');
      expect(result).toEqual([]);
    });
  });

  describe('createWithdrawal', () => {
    it('should insert and return created withdrawal', async () => {
      const fakeRow = { id: '1', requested_value: 100 };

      const fakeEntity = new Withdrawals({
        id: '1',
        transactionId: 'tx-abc',
        pensionPlanId: 'plan-123',
        requestedValue: new Money(100),
        redeemableValue: new Money(90),
        requestDate: new Date('2024-02-01T00:00:00Z'),
        status: 'PENDING',
        confirmationDate: undefined,
        rejectionReason: '',
      });

      (pgPool.query as jest.Mock).mockResolvedValueOnce({ rows: [fakeRow] });
      (WithdrawalsFactory.createFromDb as jest.Mock).mockReturnValueOnce(
        fakeEntity,
      );

      const input = {
        id: '1',
        transactionId: 'tx-abc',
        pensionPlanId: 'plan-123',
        requestedValue: 100,
        redeemableValue: 90,
        requestDate: new Date('2024-02-01T00:00:00Z'),
        status: 'PENDING',
        rejectionReason: '',
      };

      const result = await repository.createWithdrawal(input);

      expect(pgPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO withdrawals'),
        expect.arrayContaining([
          input.id,
          input.transactionId,
          input.pensionPlanId,
          input.requestedValue,
          input.redeemableValue,
        ]),
      );
      expect(WithdrawalsFactory.createFromDb).toHaveBeenCalledWith(fakeRow);
      expect(result).toBe(fakeEntity);
    });
  });
});
