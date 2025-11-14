import { WithdrawalsConfirmationUseCase } from '../../../../application/use-cases/withdrawal-confirmation.use-case';
import { UsersRepository } from '../../../../infra/persistence/repositories/users.repository';
import { PensionPlansRepository } from '../../../../infra/persistence/repositories/pension-plans.repository';
import { WithdrawalsRepository } from '../../../../infra/persistence/repositories/withdrawals.repository';
import { RejectedWithdrawalProducer } from '../../../../infra/config/rabbitmq/producers/rejected-withdrawal.producer';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Money } from '../../../../domain/value-objects/money';
import { Withdrawals } from '../../../../domain/entities/withdrawal';
import { WithdrawalsMetricsHelper } from '../../../../infra/config/observability/helpers/metrics.helper';

describe('WithdrawalsConfirmationUseCase', () => {
  let useCase: WithdrawalsConfirmationUseCase;
  let userRepo: jest.Mocked<UsersRepository>;
  let pensionPlansRepo: jest.Mocked<PensionPlansRepository>;
  let withdrawalsRepo: jest.Mocked<WithdrawalsRepository>;
  let rejectedWithdrawalProducer: jest.Mocked<RejectedWithdrawalProducer>;
  let metricsHelper: jest.Mocked<WithdrawalsMetricsHelper>;

  beforeEach(() => {
    userRepo = { findByCpf: jest.fn() } as any;
    pensionPlansRepo = { findByUserIdAndContractNumber: jest.fn() } as any;
    withdrawalsRepo = { createWithdrawal: jest.fn() } as any;

    const rabbitMqService = { send: jest.fn() };
    rejectedWithdrawalProducer = new RejectedWithdrawalProducer(
      rabbitMqService as any,
    ) as any;
    rejectedWithdrawalProducer.send = jest.fn();

    metricsHelper = {
      startSpan: jest.fn().mockReturnValue({
        span: { end: jest.fn() },
        startTime: Date.now(),
      }),
      endSpan: jest.fn(),
      success: jest.fn(),
      rejection: jest.fn(),
      error: jest.fn(),
    } as any;

    useCase = new WithdrawalsConfirmationUseCase(
      userRepo,
      pensionPlansRepo,
      withdrawalsRepo,
      rejectedWithdrawalProducer,
      metricsHelper,
    );
  });

  it('should throw erro if user was not found', async () => {
    userRepo.findByCpf.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        withdrawalId: 'w1',
        transactionId: 't1',
        cpf: '12345678900',
        contractNumber: 'CN123',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw error if pension plan was not found', async () => {
    const mockUser = { id: 1, cpf: '12345678900' };
    userRepo.findByCpf.mockResolvedValueOnce(mockUser as any);
    pensionPlansRepo.findByUserIdAndContractNumber.mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        withdrawalId: 'w1',
        transactionId: 't1',
        cpf: mockUser.cpf,
        contractNumber: 'CN123',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw erro if withdrawal was not found', async () => {
    const mockUser = { id: 1, cpf: '12345678900' };
    const mockPlan = { id: 10, withdrawals: [] };

    userRepo.findByCpf.mockResolvedValueOnce(mockUser as any);
    pensionPlansRepo.findByUserIdAndContractNumber.mockResolvedValueOnce(
      mockPlan as any,
    );

    await expect(
      useCase.execute({
        withdrawalId: 'w1',
        transactionId: 't1',
        cpf: mockUser.cpf,
        contractNumber: 'CN123',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException if withdrawal was already been confirmed', async () => {
    const mockUser = { id: 1, cpf: '12345678900' };
    const mockWithdrawal = {
      id: 'w1',
      pensionPlanId: 10,
      requestDate: new Date(),
      requestedValue: new Money(1000),
      redeemableValue: new Money(900),
      status: 'CONFIRMED',
      rejectionReason: null,
      isConfirmed: jest.fn().mockReturnValue(true),
      reject: jest.fn(),
    };

    const mockPlan = { id: 10, withdrawals: [mockWithdrawal] };

    userRepo.findByCpf.mockResolvedValueOnce(mockUser as any);
    pensionPlansRepo.findByUserIdAndContractNumber.mockResolvedValueOnce(
      mockPlan as any,
    );
    withdrawalsRepo.createWithdrawal.mockResolvedValueOnce(
      mockWithdrawal as any,
    );

    await expect(
      useCase.execute({
        withdrawalId: 'w1',
        transactionId: 't1',
        cpf: mockUser.cpf,
        contractNumber: 'CN123',
      }),
    ).rejects.toThrow(ConflictException);

    expect(rejectedWithdrawalProducer.send).toHaveBeenCalled();
    expect(mockWithdrawal.reject).toHaveBeenCalled();
  });

  it('should confirm and persist withdrawal at the database', async () => {
    const mockUser = { id: 1, cpf: '12345678900' };
    const mockWithdrawal = {
      id: 'w1',
      pensionPlanId: 10,
      transactionId: 't1',
      requestDate: new Date('2025-01-11'),
      requestedValue: new Money(1000),
      redeemableValue: new Money(900),
      status: 'PENDING',
      rejectionReason: null,
      isConfirmed: jest.fn().mockReturnValue(false),
      confirm: jest.fn().mockImplementation(function () {
        this.status = 'CONFIRMED';
      }),
    };

    const mockPlan = { id: 10, withdrawals: [mockWithdrawal] };

    userRepo.findByCpf.mockResolvedValueOnce(mockUser as any);
    pensionPlansRepo.findByUserIdAndContractNumber.mockResolvedValueOnce(
      mockPlan as any,
    );

    withdrawalsRepo.createWithdrawal.mockImplementation(async (data) => {
      return new Withdrawals({
        id: 'persisted-id',
        transactionId: data.transactionId,
        pensionPlanId: data.pensionPlanId,
        requestedValue: new Money(data.requestedValue),
        redeemableValue: new Money(data.redeemableValue),
        requestDate: data.requestDate,
        status: data.status,
        rejectionReason: data.rejectionReason,
      });
    });

    const result = await useCase.execute({
      withdrawalId: 'w1',
      transactionId: 't1',
      cpf: mockUser.cpf,
      contractNumber: 'CN123',
    });

    expect(mockWithdrawal.confirm).toHaveBeenCalled();

    expect(withdrawalsRepo.createWithdrawal).toHaveBeenCalledTimes(1);
    const persistedPayload = withdrawalsRepo.createWithdrawal.mock.calls[0][0];

    expect(persistedPayload).toMatchObject({
      transactionId: 't1',
      pensionPlanId: 10,
      requestedValue: 1000,
      redeemableValue: 900,
      status: 'CONFIRMED',
    });

    expect(result).toMatchObject({
      id: 'w1',
      pensionPlanId: 10,
      redeemableValue: new Money(900),
      rejectionReason: null,
      requestDate: new Date('2025-01-11'),
      requestedValue: new Money(1000),
      transactionId: 't1',
      status: 'CONFIRMED',
    });
  });
});
