import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { logger } from '../../observability/logger';

@Injectable()
export class RequestedWithdrawalProducer {
  constructor(private readonly rabbitMqService: RabbitMQService) {}

  async send(payload: {
    transactionId: string;
    withdrawalId: string;
    pensionPlanId: string;
    contractNumber: string;
    cpf: string;
    value: number;
    redeemableValue: number;
    requestDate: string;
  }): Promise<void> {
    await this.rabbitMqService.send('requested-withdrawal', {
      key: payload.transactionId,
      ...payload,
    });

    logger.debug('Event sent to RabbitMQ (requested-withdrawal):', payload);
  }
}
