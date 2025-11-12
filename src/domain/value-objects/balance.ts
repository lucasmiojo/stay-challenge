import { Grace } from './grace';
import { Money } from './money';

export class Balance {
  constructor(
    readonly total: Money,
    readonly available: Money,
    readonly notAvailable: Money,
    readonly grace: Grace[],
  ) {}
}
