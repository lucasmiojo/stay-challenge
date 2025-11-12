import { Balance } from '../../../../domain/value-objects/balance';
import { Money } from '../../../../domain/value-objects/money';
import { Grace } from '../../../../domain/value-objects/grace';

describe('Balance Value Object', () => {
  it('should create a Balance instance with correct values', () => {
    const total = new Money(1000);
    const available = new Money(600);
    const notAvailable = new Money(400);
    const grace = [new Grace(new Money(400), new Date())];

    const balance = new Balance(total, available, notAvailable, grace);

    expect(balance.total).toBe(total);
    expect(balance.available).toBe(available);
    expect(balance.notAvailable).toBe(notAvailable);
    expect(balance.grace).toBe(grace);
  });

  it('should handle empty grace array correctly', () => {
    const balance = new Balance(
      new Money(1000),
      new Money(1000),
      new Money(0),
      [],
    );

    expect(balance.grace).toEqual([]);
    expect(balance.total.amount).toBe(1000);
  });
});
