import { Money } from '../../../../domain/value-objects/money';
import { BadRequestException } from '@nestjs/common';

describe('Money Value Object', () => {
  it('should create a Money instance with default currency', () => {
    const money = new Money(1000);
    expect(money.amount).toBe(1000);
    expect(money.currency).toBe('BRL');
  });

  it('should round the amount when creating', () => {
    const money = new Money(1234.56);
    expect(money.amount).toBe(1235);
  });

  it('should throw if amount is negative', () => {
    expect(() => new Money(-10)).toThrow(BadRequestException);
  });

  it('should return correct value when calling getValue()', () => {
    const money = new Money(1500);
    expect(money.getValue()).toBe(15);
  });

  it('should serialize to JSON correctly', () => {
    const money = new Money(2000);
    expect(money.toJSON()).toBe('R$ 20.00');
  });

  it('should sum two Money values correctly', () => {
    const moneyA = new Money(1000);
    const moneyB = new Money(500);
    const result = moneyA.sumValues(moneyB);
    expect(result.amount).toBe(1500);
  });

  it('should subtract two Money values correctly', () => {
    const moneyA = new Money(1000);
    const moneyB = new Money(300);
    const result = moneyA.subtractValues(moneyB);
    expect(result.amount).toBe(700);
  });

  it('should multiply a Money value by a factor', () => {
    const money = new Money(1000);
    const result = money.multiplyBy(1.5);
    expect(result.amount).toBe(1500);
  });
});
