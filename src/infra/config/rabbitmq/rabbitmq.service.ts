import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { connect, Connection, Channel } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleDestroy {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnecting = false;

  private async ensureConnection() {
    if (this.channel) return; // já conectado
    if (this.isConnecting) {
      // se outro processo já está conectando, espera um pouco
      while (!this.channel) {
        await new Promise((res) => setTimeout(res, 100));
      }
      return;
    }

    this.isConnecting = true;
    const url =
      process.env.RABBITMQ_URL || 'amqp://user:password@rabbitmq:5672';
    this.connection = await connect(url);
    this.channel = await this.connection.createChannel();
    console.log('Connected to RabbitMQ');
    this.isConnecting = false;
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  async send(queue: string, message: any) {
    await this.ensureConnection();
    await this.channel!.assertQueue(queue, { durable: true });
    this.channel!.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  }

  async consume(queue: string, callback: (msg: any) => Promise<void>) {
    await this.ensureConnection();
    await this.channel!.assertQueue(queue, { durable: true });
    this.channel!.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const content = JSON.parse(msg.content.toString());
        await callback(content);
        this.channel!.ack(msg);
      } catch (err) {
        console.error(`Error processing message from ${queue}:`, err);
        this.channel!.nack(msg, false, false);
      }
    });
  }
}
