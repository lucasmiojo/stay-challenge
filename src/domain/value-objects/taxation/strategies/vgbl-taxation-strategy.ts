import { Money } from '../../money';
import { TaxationStrategy } from '../../interfaces/taxation-strategy';

export class VGBLTaxStrategy implements TaxationStrategy {
  applyTax({
    requestedValue,
    totalContributed,
  }: {
    requestedValue: Money;
    totalContributed: Money;
  }): Money {
    const taxRate = 0.15;

    // importante não usar a subtractValues direto no requestedValue pois pode gerar Money negativo (e quebra o estado válido do objeto)
    const profit = requestedValue.amount - totalContributed.amount;

    const taxable = profit > 0 ? new Money(profit) : new Money(0);

    const tax = taxable.multiplyBy(taxRate);

    return requestedValue.subtractValues(tax);
  }
}
