import { Money } from './money';

export class Grace {
  constructor(
    readonly money: Money,
    readonly availabilityDate: Date,
  ) {}

  get available() {
    return new Date() >= this.availabilityDate;
  }
}
