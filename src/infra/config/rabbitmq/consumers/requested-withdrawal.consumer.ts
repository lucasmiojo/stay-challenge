import { Injectable } from '@nestjs/common';
import { ConfirmationWithdrawalProducer } from '../producers/confirmation-withdrawal.producer';
import { WithdrawalsConfirmationUseCase } from 'src/application/use-cases/withdrawal-confirmation.use-case';
import { RabbitMQService } from '../rabbitmq.service';
import { logger } from '../../observability/logger';

@Injectable()
export class RequestedWithdrawalConsumer {
  constructor(
    private readonly confirmationWithdrawalProducer: ConfirmationWithdrawalProducer,
    private readonly withdrawalsConfirmationUseCase: WithdrawalsConfirmationUseCase,
    private readonly rabbitMqService: RabbitMQService,
  ) {}

  async onModuleInit() {
    await this.rabbitMqService.consume(
      'requested-withdrawal',
      this.handleMessage.bind(this),
    );
  }
  async handleMessage(message: any) {
    try {
      const {
        transactionId,
        withdrawalId,
        cpf,
        value,
        requestDate,
        contractNumber,
      } = message;

      logger.info(
        `Processing PENDING withdrawal id ${withdrawalId}, contractNumber: ${contractNumber}, CPF ${cpf}, value ${value}, requestDate: ${requestDate}`,
      );

      const completedWithdrawal =
        await this.withdrawalsConfirmationUseCase.execute({
          withdrawalId,
          transactionId,
          contractNumber,
          cpf,
        });

      await this.confirmationWithdrawalProducer.send({
        cpf,
        transactionId,
        pensionPlanId: completedWithdrawal!.pensionPlanId,
        requestDate: completedWithdrawal!.requestDate,
        value: completedWithdrawal!.requestedValue.amount,
        withdrawalId: completedWithdrawal!.id,
        contractNumber,
      });

      logger.debug(
        `Withdrawal with transactionId: ${transactionId}
         processed with status: ${completedWithdrawal.status} and event published`,
      );
    } catch (err) {
      logger.error('Error processing requested-withdrawal:', err);
    }
  }
}
