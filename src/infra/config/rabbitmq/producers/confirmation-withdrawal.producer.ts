import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { logger } from '../../observability/logger';

@Injectable()
export class ConfirmationWithdrawalProducer {
  constructor(private readonly rabbitMqService: RabbitMQService) {}

  async send(payload: {
    withdrawalId: string;
    transactionId: string;
    pensionPlanId: string;
    cpf: string;
    value: number;
    requestDate: Date;
    contractNumber: string;
  }): Promise<void> {
    await this.rabbitMqService.send('confirmed-withdrawal', {
      key: payload.transactionId,
      ...payload,
    });

    logger.debug('Event sent to RabbitMQ (confirmed-withdrawal):', payload);
  }
}
