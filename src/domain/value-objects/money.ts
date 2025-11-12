import { BadRequestException } from '@nestjs/common';

export class Money {
  readonly amount: number;
  readonly currency: string;

  constructor(amount: number, currency: string = 'BRL') {
    if (amount < 0) {
      throw new BadRequestException('Amount should be higher than 0');
    }
    this.amount = Math.round(amount);
    this.currency = currency;
  }

  static fromReais(value: number, currency: string = 'BRL'): Money {
    return new Money(Math.round(value * 100), currency);
  }

  getValue(): number {
    return this.amount / 100;
  }

  toJSON() {
    return `R$ ${this.getValue().toFixed(2)}`;
  }

  sumValues(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtractValues(other: Money): Money {
    return new Money(this.amount - other.amount);
  }

  multiplyBy(factor: number): Money {
    return new Money(Math.round(this.amount * factor));
  }
}
