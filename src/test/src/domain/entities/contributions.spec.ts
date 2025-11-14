import { Contributions } from '../../../../domain/entities/contributions';
import { Money } from '../../../../domain/value-objects/money';

describe('Contributions', () => {
  const makeMoney = (amount: number) => new Money(amount);

  it('should create a contribution with correct properties', () => {
    const now = new Date();
    const contribution = new Contributions({
      id: 'abc123',
      money: makeMoney(500),
      startDate: now,
      availabilityDate: now,
    });

    expect(contribution.id).toBe('abc123');
    expect(contribution.money).toBeInstanceOf(Money);
    expect(contribution.money.amount).toBe(500);
    expect(contribution.startDate).toBe(now);
    expect(contribution.availabilityDate).toBe(now);
  });

  it('should return true for isAvailable() when availabilityDate is in the past', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60);
    const contribution = new Contributions({
      id: '1',
      money: makeMoney(1000),
      startDate: pastDate,
      availabilityDate: pastDate,
    });

    expect(contribution.isAvailable()).toBe(true);
    expect(contribution.isUnavailable()).toBe(false);
  });

  it('should return false for isAvailable() and true for isUnavailable() when availabilityDate is in the future', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60);
    const contribution = new Contributions({
      id: '2',
      money: makeMoney(2000),
      startDate: new Date(),
      availabilityDate: futureDate,
    });

    expect(contribution.isAvailable()).toBe(false);
    expect(contribution.isUnavailable()).toBe(true);
  });

  it('should return true for isAvailable() if availabilityDate equals current time', () => {
    const now = new Date();
    const contribution = new Contributions({
      id: '3',
      money: makeMoney(3000),
      startDate: now,
      availabilityDate: now,
    });

    expect(contribution.isAvailable()).toBe(true);
    expect(contribution.isUnavailable()).toBe(false);
  });
});
