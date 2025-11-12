import { WithdrawalsService } from '../../../../domain/services/withdrawal-service';
import { PensionPlan } from '../../../../domain/entities/pension-plan';
import { Withdrawals } from '../../../../domain/entities/withdrawal';
import { Money } from '../../../../domain/value-objects/money';

describe('WithdrawalsService', () => {
  const mockTaxation = {
    applyTax: jest.fn(({ requestedValue }) => requestedValue),
  };

  const basePensionPlan = {
    id: 'plan-123',
    calculateBalance: jest.fn().mockReturnValue({
      available: new Money(1000),
    }),
    getTaxation: jest.fn().mockReturnValue(mockTaxation),
  } as unknown as PensionPlan;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a PENDING withdrawal when requested value is within balance', () => {
    const service = new WithdrawalsService();
    const requestedValue = new Money(500);

    const result = service.request(requestedValue, basePensionPlan);

    expect(result).toBeInstanceOf(Withdrawals);
    expect(result.status).toBe('PENDING');
    expect(mockTaxation.applyTax).toHaveBeenCalledWith({
      requestedValue,
      totalContributed: new Money(1000),
    });
  });

  it('should create a REJECTED withdrawal when requested value is greater than balance', () => {
    const service = new WithdrawalsService();
    const requestedValue = new Money(1500);

    const result = service.request(requestedValue, basePensionPlan);

    expect(result).toBeInstanceOf(Withdrawals);
    expect(result.status).toBe('REJECTED');
    expect(result.rejectionReason).toBe(
      'Requested value is higher than the available',
    );
    expect(mockTaxation.applyTax).not.toHaveBeenCalled();
  });

  it('should generate unique IDs and timestamps', () => {
    const service = new WithdrawalsService();
    const requestedValue = new Money(100);

    const w1 = service.request(requestedValue, basePensionPlan);
    const w2 = service.request(requestedValue, basePensionPlan);

    expect(w1.id).not.toBe(w2.id);
    expect(w1.transactionId).not.toBe(w2.transactionId);
    expect(w1.requestDate).toBeInstanceOf(Date);
  });
});
