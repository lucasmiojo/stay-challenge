import { Module } from '@nestjs/common';
import { WithdrawalsController } from './withdrawal.controller';
import { WithdrawalsUseCaseModule } from './use-cases/withdrawals-use-case.module';

@Module({
  imports: [WithdrawalsUseCaseModule],
  controllers: [WithdrawalsController],
})
export class WithdrawalsModule {}
