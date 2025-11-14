import { PGBLTaxStrategy } from '../../../../../../domain/value-objects/taxation/strategies/pgbl-taxation-strategy';
import { Money } from '../../../../../../domain/value-objects/money';

describe('PGBLTaxStrategy', () => {
  it('should apply 15% tax correctly', () => {
    const strategy = new PGBLTaxStrategy();
    const requestedValue = new Money(10000); // 100.00 BRL

    const result = strategy.applyTax({ requestedValue });

    // 15% desconto → 85% resta
    expect(result.amount).toBe(8500);
  });

  it('should return Money instance', () => {
    const strategy = new PGBLTaxStrategy();
    const requestedValue = new Money(5000);
    const result = strategy.applyTax({ requestedValue });

    expect(result).toBeInstanceOf(Money);
  });
});
