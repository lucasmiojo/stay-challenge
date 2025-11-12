import { Money } from '../money';

export interface TaxationStrategy {
  applyTax(input: { requestedValue: Money; totalContributed: Money }): Money;
}
