// taxation.module.ts
import { Module } from '@nestjs/common';
import { PGBLTaxStrategy } from 'src/domain/value-objects/taxation/strategies/pgbl-taxation-strategy';
import { VGBLTaxStrategy } from 'src/domain/value-objects/taxation/strategies/vgbl-taxation-strategy';
import { TaxationStrategyFactory } from 'src/domain/value-objects/taxation/taxation-factory';

@Module({
  providers: [TaxationStrategyFactory, PGBLTaxStrategy, VGBLTaxStrategy],
  exports: [TaxationStrategyFactory],
})
export class TaxationModule {}
