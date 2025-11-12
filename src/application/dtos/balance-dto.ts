import { Balance } from 'src/domain/value-objects/balance';

export class BalanceDTO {
  total: string;
  available: string;
  notAvailable: string;
  graces: { value: string; availabilityDate: string }[];

  static fromEntity(balance: Balance): BalanceDTO {
    return {
      total: balance.total.toJSON(),
      available: balance.available.toJSON(),
      notAvailable: balance.notAvailable.toJSON(),
      graces: balance.grace.map((grace) => ({
        value: grace.money.toJSON(),
        availabilityDate: grace.availabilityDate.toISOString().split('T')[0],
      })),
    };
  }
}
