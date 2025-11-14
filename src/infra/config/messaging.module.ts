import { forwardRef, Module } from '@nestjs/common';
import { ConfirmationWithdrawalConsumer } from './rabbitmq/consumers/confirmation-withdrawal.consumer';
import { RequestedWithdrawalConsumer } from './rabbitmq/consumers/requested-withdrawal.consumer';
import { RequestedWithdrawalProducer } from './rabbitmq/producers/requested-withdrawal.producer';
import { ConfirmationWithdrawalProducer } from './rabbitmq/producers/confirmation-withdrawal.producer';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { WithdrawalsUseCaseModule } from 'src/api/withdrawal/use-cases/withdrawals-use-case.module';
import { RejectedWithdrawalProducer } from './rabbitmq/producers/rejected-withdrawal.producer';

@Module({
  imports: [forwardRef(() => WithdrawalsUseCaseModule)],
  providers: [
    RabbitMQService,
    ConfirmationWithdrawalProducer,
    RequestedWithdrawalProducer,
    ConfirmationWithdrawalConsumer,
    RequestedWithdrawalConsumer,
    RejectedWithdrawalProducer,
  ],
  exports: [
    RabbitMQService,
    ConfirmationWithdrawalProducer,
    RequestedWithdrawalProducer,
    RejectedWithdrawalProducer,
  ],
})
export class MessagingModule {}
