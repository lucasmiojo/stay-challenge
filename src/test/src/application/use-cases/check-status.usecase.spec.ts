import { Money } from '../../../../domain/value-objects/money';
import { CheckStatusUseCase } from '../../../../application/use-cases/check-status.use-case';
import { WithdrawalsRepository } from '../../../../infra/persistence/repositories/withdrawals.repository';
import { NotFoundException } from '@nestjs/common';
import { Withdrawals } from '../../../../domain/entities/withdrawal';

describe('CheckStatusUseCase', () => {
  let useCase: CheckStatusUseCase;
  let withdrawalsRepo: jest.Mocked<WithdrawalsRepository>;

  beforeEach(() => {
    withdrawalsRepo = {
      findByTransactionId: jest.fn(),
    } as any;

    useCase = new CheckStatusUseCase(withdrawalsRepo);
    jest.clearAllMocks();
  });

  it('should throw NotFoundException if no transactions found', async () => {
    (withdrawalsRepo.findByTransactionId as jest.Mock).mockResolvedValueOnce(
      [],
    );

    await expect(useCase.execute('tx-1')).rejects.toThrow(NotFoundException);
    expect(withdrawalsRepo.findByTransactionId).toHaveBeenCalledWith('tx-1');
  });

  it('should map withdrawals to StatusResponseDTO correctly', async () => {
    const fakeEntities: Withdrawals[] = [
      new Withdrawals({
        id: 'w1',
        transactionId: 'tx-123',
        pensionPlanId: 'plan-1',
        requestedValue: new Money(1000),
        redeemableValue: new Money(850),
        requestDate: new Date('2024-01-01T00:00:00.000Z'),
        status: 'CONFIRMED',
        confirmationDate: new Date('2024-01-02T00:00:00.000Z'),
      }),
      new Withdrawals({
        id: 'w2',
        transactionId: 'tx-456',
        pensionPlanId: 'plan-2',
        requestedValue: new Money(500),
        redeemableValue: new Money(450),
        requestDate: new Date('2024-02-01T00:00:00.000Z'),
        status: 'PENDING',
        confirmationDate: undefined,
        rejectionReason: undefined,
      }),
    ];

    (withdrawalsRepo.findByTransactionId as jest.Mock).mockResolvedValueOnce(
      fakeEntities,
    );

    const result = await useCase.execute('tx-123');

    expect(withdrawalsRepo.findByTransactionId).toHaveBeenCalledWith('tx-123');
    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      transactionId: 'tx-123',
      pensionPlanId: 'plan-1',
      requestedValue: 1000,
      redeemableValue: 850,
      requestDate: '2024-01-01T00:00:00.000Z',
      status: 'CONFIRMED',
      rejectionReason: undefined,
    });

    expect(result[1]).toEqual({
      transactionId: 'tx-456',
      pensionPlanId: 'plan-2',
      requestedValue: 500,
      redeemableValue: 450,
      requestDate: '2024-02-01T00:00:00.000Z',
      status: 'PENDING',
      rejectionReason: undefined,
    });
  });
});
