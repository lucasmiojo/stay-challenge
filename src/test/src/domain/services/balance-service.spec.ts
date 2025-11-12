import { BalanceService } from '../../../../domain/services/balance-service';
import { PensionPlan } from '../../../../domain/entities/pension-plan';
import { Balance } from '../../../../domain/value-objects/balance';
import { Money } from '../../../../domain/value-objects/money';
import { Grace } from '../../../../domain/value-objects/grace';

describe('BalanceService', () => {
  it('should calculate balance using PensionPlan.calculateBalance', () => {
    const fakeBalance = new Balance(
      new Money(1000),
      new Money(800),
      new Money(200),
      [] as Grace[],
    );
    const pensionPlan = {
      calculateBalance: jest.fn().mockReturnValue(fakeBalance),
    } as unknown as PensionPlan;

    const service = new BalanceService();
    const result = service.calculateBalance(pensionPlan);

    expect(pensionPlan.calculateBalance).toHaveBeenCalled();
    expect(result).toBe(fakeBalance);
  });
});
