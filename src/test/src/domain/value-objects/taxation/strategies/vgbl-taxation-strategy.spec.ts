import { VGBLTaxStrategy } from '../../../../../../domain/value-objects/taxation/strategies/vgbl-taxation-strategy';
import { Money } from '../../../../../../domain/value-objects/money';

describe('VGBLTaxStrategy', () => {
  it('should apply 15% tax only on profit', () => {
    const strategy = new VGBLTaxStrategy();
    const requestedValue = new Money(15000); // R$150.00
    const totalContributed = new Money(10000); // R$100.00

    const result = strategy.applyTax({ requestedValue, totalContributed });

    // profit = 15000 - 10000 = 5000 → 15% tax = 750
    // result = 15000 - 750 = 14250
    expect(result.amount).toBe(14250);
  });

  it('should not apply tax when there is no profit', () => {
    const strategy = new VGBLTaxStrategy();
    const requestedValue = new Money(9000);
    const totalContributed = new Money(10000);

    const result = strategy.applyTax({ requestedValue, totalContributed });

    expect(result.amount).toBe(9000);
  });

  it('should return a Money instance', () => {
    const strategy = new VGBLTaxStrategy();
    const requestedValue = new Money(12000);
    const totalContributed = new Money(10000);
    const result = strategy.applyTax({ requestedValue, totalContributed });

    expect(result).toBeInstanceOf(Money);
  });
});
