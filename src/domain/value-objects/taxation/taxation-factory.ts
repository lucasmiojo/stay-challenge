import { TaxationStrategy } from '../interfaces/taxation-strategy';
import { PGBLTaxStrategy } from './strategies/pgbl-taxation-strategy';
import { VGBLTaxStrategy } from './strategies/vgbl-taxation-strategy';

export class TaxationStrategyFactory {
  static create(planType: string): TaxationStrategy {
    const strategies: Record<string, TaxationStrategy> = {
      PGBL: new PGBLTaxStrategy(),
      VGBL: new VGBLTaxStrategy(),
    };

    const strategy = strategies[planType];
    if (!strategy) throw new Error(`Unsupported plan type: ${planType}`);
    return strategy;
  }
}
