import { forwardRef, Module } from '@nestjs/common';
import { UsersRepository } from 'src/infra/persistence/repositories/users.repository';
import { PensionPlansRepository } from 'src/infra/persistence/repositories/pension-plans.repository';
import { WithdrawalsRepository } from 'src/infra/persistence/repositories/withdrawals.repository';
import { WithdrawalsService } from 'src/domain/services/withdrawal-service';
import { WithdrawalsConfirmationUseCase } from 'src/application/use-cases/withdrawal-confirmation.use-case';
import { WithdrawalsRequestUseCase } from 'src/application/use-cases/withdrawal-request.use-case';
import { MessagingModule } from 'src/infra/config/messaging.module';

@Module({
  imports: [
    forwardRef(() => MessagingModule), // 👈 resolve o ciclo inverso
  ],
  providers: [
    UsersRepository,
    PensionPlansRepository,
    WithdrawalsRepository,
    WithdrawalsService,
    WithdrawalsConfirmationUseCase,
    WithdrawalsRequestUseCase,
  ],
  exports: [WithdrawalsConfirmationUseCase, WithdrawalsRequestUseCase],
})
export class WithdrawalsUseCaseModule {}
