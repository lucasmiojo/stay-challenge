import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';
import { CheckStatusUseCase } from 'src/application/use-cases/check-status.use-case';
import { WithdrawalsRepository } from 'src/infra/persistence/repositories/withdrawals.repository';

@Module({
  providers: [WithdrawalsRepository, CheckStatusUseCase],
  controllers: [StatusController],
})
export class StatusModule {}
