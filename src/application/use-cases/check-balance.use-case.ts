import { BalanceService } from '../../domain/services/balance-service';
import { BalanceDTO } from '../dtos/balance-dto';
import { UsersRepository } from '../../infra/persistence/repositories/users.repository';
import { PensionPlansRepository } from '../../infra/persistence/repositories/pension-plans.repository';
import { redisClient } from '../../infra/persistence/database/redis/redis.client';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class CheckBalanceUseCase {
  constructor(
    private readonly userRepo: UsersRepository,
    private readonly pensionPlansRepository: PensionPlansRepository,
    private readonly balanceService: BalanceService,
  ) {}

  async execute(cpf: string, contractNumber: string): Promise<BalanceDTO> {
    const cacheKey = `balance:${cpf}:${contractNumber}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(
        `return cached balance to key:${cpf}:${contractNumber} (CPF:ContractNumber)`,
      );
      return JSON.parse(cached);
    }

    const user = await this.userRepo.findByCpf(cpf);
    if (!user) throw new NotFoundException('User not found');

    const pensionPlan =
      await this.pensionPlansRepository.findByUserIdAndContractNumber(
        user.id,
        contractNumber,
      );

    if (!pensionPlan) throw new NotFoundException('Pension Plan was not found');

    const balance = this.balanceService.calculateBalance(pensionPlan);

    const response = BalanceDTO.fromEntity(balance);

    await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 });

    console.log(
      `Balance calculated and stored on cache for key:${cpf}:${contractNumber} (CPF:ContractNumber)`,
    );

    return response;
  }
}
