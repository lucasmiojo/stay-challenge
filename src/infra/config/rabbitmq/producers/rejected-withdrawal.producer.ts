import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { logger } from '../../observability/logger';

@Injectable()
export class RejectedWithdrawalProducer {
  constructor(private readonly rabbitMqService: RabbitMQService) {}

  async send(payload: {
    withdrawalId: string;
    transactionId: string;
    pensionPlanId: string;
    contractNumber: string;
    cpf: string;
    value: number;
    redeemableValue: number;
    rejectionReason?: string;
    requestDate: string;
  }): Promise<void> {
    await this.rabbitMqService.send('rejected-withdrawal', {
      key: payload.transactionId,
      ...payload,
    });

    logger.debug('Event sent to RabbitMQ (rejected-withdrawal):', payload);
  }
}
