import { Injectable } from '@nestjs/common';
import { redisClient } from 'src/infra/persistence/database/redis/redis.client';
import { RabbitMQService } from '../rabbitmq.service';

@Injectable()
export class ConfirmationWithdrawalConsumer {
  constructor(private readonly rabbitMqService: RabbitMQService) {}

  async onModuleInit() {
    await this.rabbitMqService.consume(
      'confirmed-withdrawal',
      this.handleMessage.bind(this),
    );
  }
  async handleMessage(message: any) {
    try {
      const { cpf, contractNumber } = message;
      console.log(`Event received: confirmed-withdrawal -> CPF ${cpf}`);

      const cacheKey = `balance:${cpf}:${contractNumber}`;
      await redisClient.del(cacheKey);

      console.log(`Cache cleaned for user CPF: ${cpf}`);
    } catch (err) {
      console.error('Error processing confirmed-withdrawal message:', err);
    }
  }
}
