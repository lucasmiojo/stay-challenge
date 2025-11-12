// src/types/amqplib.d.ts
declare module 'amqplib' {
  export interface Connection {
    createChannel(): Promise<Channel>;
    close(): Promise<void>;
  }

  export interface Channel {
    assertQueue(queue: string, options?: any): Promise<any>;
    sendToQueue(queue: string, content: Buffer, options?: any): boolean;
    consume(
      queue: string,
      callback: (msg: any) => void,
      options?: any,
    ): Promise<any>;
    ack(msg: any): void;
    nack(msg: any, allUpTo?: boolean, requeue?: boolean): void;
    close(): Promise<void>;
  }

  export function connect(url: string): Promise<Connection>;
}
