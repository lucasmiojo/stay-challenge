import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';

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

    console.log('Event sent to RabbitMQ (rejected-withdrawal):', payload);
  }
}
