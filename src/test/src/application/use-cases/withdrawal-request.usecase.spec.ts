import { WithdrawalsRequestUseCase } from '../../../../application/use-cases/withdrawal-request.use-case';
import { UsersRepository } from '../../../../infra/persistence/repositories/users.repository';
import { PensionPlansRepository } from '../../../../infra/persistence/repositories/pension-plans.repository';
import { WithdrawalsRepository } from '../../../../infra/persistence/repositories/withdrawals.repository';
import { WithdrawalsService } from '../../../../domain/services/withdrawal-service';
import { RequestedWithdrawalProducer } from '../../../../infra/config/rabbitmq/producers/requested-withdrawal.producer';
import { RejectedWithdrawalProducer } from '../../../../infra/config/rabbitmq/producers/rejected-withdrawal.producer';
import { Money } from '../../../../domain/value-objects/money';
import { NotFoundException } from '@nestjs/common';

describe('WithdrawalsRequestUseCase', () => {
  let useCase: WithdrawalsRequestUseCase;
  let userRepo: jest.Mocked<UsersRepository>;
  let pensionPlansRepo: jest.Mocked<PensionPlansRepository>;
  let withdrawalsRepo: jest.Mocked<WithdrawalsRepository>;
  let withdrawalsService: jest.Mocked<WithdrawalsService>;
  let requestedWithdrawalProducer: jest.Mocked<RequestedWithdrawalProducer>;
  let rejectedWithdrawalProducer: jest.Mocked<RejectedWithdrawalProducer>;

  beforeEach(() => {
    userRepo = { findByCpf: jest.fn() } as any;
    pensionPlansRepo = {
      findByUserIdAndContractNumber: jest.fn(),
    } as any;
    withdrawalsRepo = { createWithdrawal: jest.fn() } as any;
    withdrawalsService = { request: jest.fn() } as any;

    const rabbitMqService = { send: jest.fn() };
    requestedWithdrawalProducer = new RequestedWithdrawalProducer(
      rabbitMqService as any,
    ) as any;
    rejectedWithdrawalProducer = new RejectedWithdrawalProducer(
      rabbitMqService as any,
    ) as any;

    requestedWithdrawalProducer.send = jest.fn();
    rejectedWithdrawalProducer.send = jest.fn();

    useCase = new WithdrawalsRequestUseCase(
      userRepo,
      pensionPlansRepo,
      withdrawalsRepo,
      withdrawalsService,
      requestedWithdrawalProducer,
      rejectedWithdrawalProducer,
    );
  });

  it('should throw if user not found', async () => {
    userRepo.findByCpf.mockResolvedValueOnce(null);

    await expect(
      useCase.execute('12345678900', new Money(1000), 'CN123'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw if pension plan not found', async () => {
    userRepo.findByCpf.mockResolvedValueOnce({ id: 1, cpf: '12345678900' });
    pensionPlansRepo.findByUserIdAndContractNumber.mockResolvedValueOnce(null);
    await expect(
      useCase.execute('12345678900', new Money(1000), 'CN001'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should send event to requestedWithdrawalProducer when its confirmed', async () => {
    const mockUser = { id: 1, cpf: '12345678900' };
    const mockPlan = { id: 10 };
    const mockWithdrawalRequest = {
      id: 'w1',
      transactionId: 't1',
      pensionPlanId: 10,
      requestedValue: new Money(1000),
      redeemableValue: new Money(900),
      requestDate: new Date(),
      status: 'CONFIRMED',
      rejectionReason: null,
      isRejected: jest.fn().mockReturnValue(false),
    };
    const mockCreated = { ...mockWithdrawalRequest };

    userRepo.findByCpf.mockResolvedValueOnce(mockUser as any);
    pensionPlansRepo.findByUserIdAndContractNumber.mockResolvedValueOnce(
      mockPlan as any,
    );
    withdrawalsService.request.mockReturnValueOnce(
      mockWithdrawalRequest as any,
    );
    withdrawalsRepo.createWithdrawal.mockResolvedValueOnce(mockCreated as any);

    const result = await useCase.execute(
      mockUser.cpf,
      new Money(1000),
      'CN123',
    );

    expect(requestedWithdrawalProducer.send).toHaveBeenCalled();
    expect(result).toMatchObject({
      transactionId: 't1',
      requestedValue: 1000,
      status: 'CONFIRMED',
    });
  });

  it('should send event to rejectedWithdrawalProducer when its rejected', async () => {
    const mockUser = { id: 1, cpf: '12345678900' };
    const mockPlan = { id: 10 };
    const mockWithdrawalRequest = {
      id: 'w2',
      transactionId: 't2',
      pensionPlanId: 10,
      requestedValue: new Money(1000),
      redeemableValue: new Money(0),
      requestDate: new Date(),
      status: 'REJECTED',
      rejectionReason: 'Requested value is higher than the available',
      isRejected: jest.fn().mockReturnValue(true),
    };
    const mockCreated = { ...mockWithdrawalRequest };

    userRepo.findByCpf.mockResolvedValueOnce(mockUser as any);
    pensionPlansRepo.findByUserIdAndContractNumber.mockResolvedValueOnce(
      mockPlan as any,
    );
    withdrawalsService.request.mockReturnValueOnce(
      mockWithdrawalRequest as any,
    );
    withdrawalsRepo.createWithdrawal.mockResolvedValueOnce(mockCreated as any);

    const result = await useCase.execute(
      mockUser.cpf,
      new Money(1000),
      'CN123',
    );

    expect(rejectedWithdrawalProducer.send).toHaveBeenCalled();
    expect(result.status).toBe('REJECTED');
  });
});
