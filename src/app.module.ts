import { Module } from '@nestjs/common';
import { WithdrawalsModule } from './api/withdrawal/withdrawals.module';
import { BalanceModule } from './api/balance/balance.module';
import { RabbitMQService } from './infra/config/rabbitmq/rabbitmq.service';
import { TaxationModule } from './api/taxation/taxation.module';
import { StatusModule } from './api/status/status.module';

@Module({
  imports: [BalanceModule, WithdrawalsModule, TaxationModule, StatusModule],
  providers: [RabbitMQService],
})
export class AppModule {}
