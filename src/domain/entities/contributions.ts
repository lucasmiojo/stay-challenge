import { Money } from '../value-objects/money';

export class Contributions {
  readonly id: string;
  readonly money: Money;
  readonly startDate: Date;
  readonly availabilityDate: Date;
  constructor({ id, money, startDate, availabilityDate }) {
    this.id = id;
    this.money = money;
    this.startDate = startDate;
    this.availabilityDate = availabilityDate;
  }

  isAvailable(): boolean {
    return this.availabilityDate <= new Date();
  }

  isUnavailable(): boolean {
    return new Date() < this.availabilityDate;
  }
}
