import { Module } from '@nestjs/common';
import { CheckBalanceUseCase } from 'src/application/use-cases/check-balance.use-case';
import { BalanceService } from 'src/domain/services/balance-service';
import { PensionPlansRepository } from 'src/infra/persistence/repositories/pension-plans.repository';
import { UsersRepository } from 'src/infra/persistence/repositories/users.repository';
import { BalanceController } from './balance.controller';

@Module({
  providers: [
    UsersRepository,
    PensionPlansRepository,
    BalanceService,
    CheckBalanceUseCase,
  ],
  controllers: [BalanceController],
})
export class BalanceModule {}
