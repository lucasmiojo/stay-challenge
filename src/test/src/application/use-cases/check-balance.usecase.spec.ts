import { CheckBalanceUseCase } from '../../../../application/use-cases/check-balance.use-case';
import { UsersRepository } from '../../../../infra/persistence/repositories/users.repository';
import { PensionPlansRepository } from '../../../../infra/persistence/repositories/pension-plans.repository';
import { BalanceService } from '../../../../domain/services/balance-service';
import { BalanceDTO } from '../../../../application/dtos/balance-dto';
import { NotFoundException } from '@nestjs/common';
import { redisClient } from '../../../../infra/persistence/database/redis/redis.client';

jest.mock('../../../../infra/persistence/database/redis/redis.client', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('CheckBalanceUseCase', () => {
  let useCase: CheckBalanceUseCase;
  let userRepo: jest.Mocked<UsersRepository>;
  let pensionRepo: jest.Mocked<PensionPlansRepository>;
  let balanceService: jest.Mocked<BalanceService>;

  beforeEach(() => {
    userRepo = {
      findByCpf: jest.fn(),
    } as any;

    pensionRepo = {
      findByUserIdAndContractNumber: jest.fn(),
    } as any;

    balanceService = {
      calculateBalance: jest.fn(),
    } as any;

    useCase = new CheckBalanceUseCase(userRepo, pensionRepo, balanceService);
    jest.clearAllMocks();
  });

  it('should return cached balance if present in Redis', async () => {
    const cpf = '12345678900';
    const contractNumber = 'ABC123';
    const cachedBalance = { total: 5000 };

    (redisClient.get as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(cachedBalance),
    );

    const result = await useCase.execute(cpf, contractNumber);

    expect(redisClient.get).toHaveBeenCalledWith(
      `balance:${cpf}:${contractNumber}`,
    );
    expect(result).toEqual(cachedBalance);
    expect(userRepo.findByCpf).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if user does not exist', async () => {
    (redisClient.get as jest.Mock).mockResolvedValueOnce(null);
    (userRepo.findByCpf as jest.Mock).mockResolvedValueOnce(null);

    await expect(useCase.execute('123', 'ABC')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw NotFoundException if pension plan does not exist', async () => {
    const fakeUser = { id: 'u1', cpf: '123' };

    (redisClient.get as jest.Mock).mockResolvedValueOnce(null);
    (userRepo.findByCpf as jest.Mock).mockResolvedValueOnce(fakeUser);
    (
      pensionRepo.findByUserIdAndContractNumber as jest.Mock
    ).mockResolvedValueOnce(null);

    await expect(useCase.execute('123', 'CN1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should calculate balance and store in cache if not cached', async () => {
    const cpf = '999';
    const contractNumber = 'C123';
    const fakeUser = { id: 'user-1', cpf };
    const fakePlan = { id: 'plan-1', type: 'PGBL' };
    const fakeBalanceEntity = { total: 1234 };
    const fakeDTO = { total: 1234 };

    (redisClient.get as jest.Mock).mockResolvedValueOnce(null);
    (userRepo.findByCpf as jest.Mock).mockResolvedValueOnce(fakeUser);
    (
      pensionRepo.findByUserIdAndContractNumber as jest.Mock
    ).mockResolvedValueOnce(fakePlan);
    (balanceService.calculateBalance as jest.Mock).mockReturnValue(
      fakeBalanceEntity,
    );

    const dtoSpy = jest
      .spyOn(BalanceDTO, 'fromEntity')
      .mockReturnValue(fakeDTO as any);

    const result = await useCase.execute(cpf, contractNumber);

    expect(userRepo.findByCpf).toHaveBeenCalledWith(cpf);
    expect(pensionRepo.findByUserIdAndContractNumber).toHaveBeenCalledWith(
      fakeUser.id,
      contractNumber,
    );
    expect(balanceService.calculateBalance).toHaveBeenCalledWith(fakePlan);
    expect(dtoSpy).toHaveBeenCalledWith(fakeBalanceEntity);
    expect(redisClient.set).toHaveBeenCalledWith(
      `balance:${cpf}:${contractNumber}`,
      JSON.stringify(fakeDTO),
      { EX: 60 },
    );
    expect(result).toBe(fakeDTO);
  });
});
