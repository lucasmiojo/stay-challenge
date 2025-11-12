import { TaxationStrategy } from '../../interfaces/taxation-strategy';
import { Money } from '../../money';

export class PGBLTaxStrategy implements TaxationStrategy {
  applyTax({ requestedValue }: { requestedValue: Money }): Money {
    const taxRate = 0.15; // 15% sobre o total
    return requestedValue.multiplyBy(1 - taxRate);
  }
}
