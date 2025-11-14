import { Grace } from '../../../../domain/value-objects/grace';
import { Money } from '../../../../domain/value-objects/money';

describe('Grace Value Object', () => {
  it('should create a Grace instance with given money and date', () => {
    const money = new Money(1000);
    const date = new Date('2025-01-01');
    const grace = new Grace(money, date);

    expect(grace.money).toBe(money);
    expect(grace.availabilityDate).toBe(date);
  });

  it('should be available if current date is after availabilityDate', () => {
    const money = new Money(1000);
    const date = new Date(Date.now() - 1000);
    const grace = new Grace(money, date);

    expect(grace.available).toBe(true);
  });

  it('should be unavailable if current date is before availabilityDate', () => {
    const money = new Money(1000);
    const date = new Date(Date.now() + 100000);
    const grace = new Grace(money, date);

    expect(grace.available).toBe(false);
  });
});
