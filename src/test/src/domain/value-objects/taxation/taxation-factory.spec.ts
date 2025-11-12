import { TaxationStrategyFactory } from '../../../../../domain/value-objects/taxation/taxation-factory';
import { PGBLTaxStrategy } from '../../../../../domain/value-objects/taxation/strategies/pgbl-taxation-strategy';
import { VGBLTaxStrategy } from '../../../../../domain/value-objects/taxation/strategies/vgbl-taxation-strategy';

describe('TaxationStrategyFactory', () => {
  it('should return PGBLTaxStrategy when planType is PGBL', () => {
    const strategy = TaxationStrategyFactory.create('PGBL');
    expect(strategy).toBeInstanceOf(PGBLTaxStrategy);
  });

  it('should return VGBLTaxStrategy when planType is VGBL', () => {
    const strategy = TaxationStrategyFactory.create('VGBL');
    expect(strategy).toBeInstanceOf(VGBLTaxStrategy);
  });

  it('should throw an error for unsupported plan type', () => {
    expect(() => TaxationStrategyFactory.create('INVALID')).toThrow(
      'Unsupported plan type: INVALID',
    );
  });
});
