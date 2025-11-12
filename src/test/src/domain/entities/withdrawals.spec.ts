import { Withdrawals } from '../../../../domain/entities/withdrawal';
import { Money } from '../../../../domain/value-objects/money';

describe('Withdrawals Entity', () => {
  const now = new Date();
  const pastDate = new Date(now.getTime() - 86400000); // 1 day ago
  const futureDate = new Date(now.getTime() + 86400000); // 1 day ahead

  const baseProps = {
    id: 'w1',
    transactionId: 'tx1',
    pensionPlanId: 'p1',
    requestedValue: new Money(1000),
    redeemableValue: new Money(800),
    requestDate: now,
    status: 'PENDING' as const,
  };

  it('should create a valid Withdrawals instance', () => {
    const withdrawal = new Withdrawals(baseProps);

    expect(withdrawal).toBeInstanceOf(Withdrawals);
    expect(withdrawal.id).toBe('w1');
    expect(withdrawal.transactionId).toBe('tx1');
    expect(withdrawal.pensionPlanId).toBe('p1');
    expect(withdrawal.requestedValue.amount).toBe(1000);
    expect(withdrawal.redeemableValue.amount).toBe(800);
    expect(withdrawal.status).toBe('PENDING');
    expect(withdrawal.confirmationDate).toBeUndefined();
    expect(withdrawal.rejectionReason).toBeUndefined();
  });

  it('should return true for isAvailable when current date >= requestDate', () => {
    const withdrawal = new Withdrawals({ ...baseProps, requestDate: pastDate });
    expect(withdrawal.isAvailable()).toBe(true);
  });

  it('should return false for isAvailable when current date < requestDate', () => {
    const withdrawal = new Withdrawals({
      ...baseProps,
      requestDate: futureDate,
    });
    expect(withdrawal.isAvailable()).toBe(false);
  });

  it('should confirm a withdrawal correctly', () => {
    const withdrawal = new Withdrawals(baseProps);
    withdrawal.confirm();

    expect(withdrawal.status).toBe('CONFIRMED');
    expect(withdrawal.isConfirmed()).toBe(true);
    expect(withdrawal.confirmationDate).toBeInstanceOf(Date);
  });

  it('should reject a withdrawal with a reason', () => {
    const withdrawal = new Withdrawals(baseProps);
    withdrawal.reject('Requested value is higher than the available');

    expect(withdrawal.status).toBe('REJECTED');
    expect(withdrawal.isRejected()).toBe(true);
    expect(withdrawal.rejectionReason).toBe(
      'Requested value is higher than the available',
    );
  });

  it('should not modify immutable properties when confirmed or rejected', () => {
    const withdrawal = new Withdrawals(baseProps);
    const initialRedeemable = withdrawal.redeemableValue.amount;

    withdrawal.confirm();
    expect(withdrawal.redeemableValue.amount).toBe(initialRedeemable);

    withdrawal.reject('Some reason');
    expect(withdrawal.redeemableValue.amount).toBe(initialRedeemable);
  });
});
