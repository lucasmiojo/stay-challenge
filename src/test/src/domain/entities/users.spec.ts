import { User } from '../../../../domain/entities/user';
import { PensionPlan } from '../../../../domain/entities/pension-plan';

describe('User Entity', () => {
  const mockPensionPlans: PensionPlan[] = [
    {
      id: 'plan-1',
      type: 'PGBL',
      contractNumber: '12345',
      startDate: new Date('2022-01-01'),
      contributions: [],
      withdrawals: [],
      getYieldRate: jest.fn().mockReturnValue(0.2),
      getTaxation: jest.fn(),
      calculateBalance: jest.fn(),
    } as unknown as PensionPlan,
    {
      id: 'plan-2',
      type: 'VGBL',
      contractNumber: '67890',
      startDate: new Date('2023-01-01'),
      contributions: [],
      withdrawals: [],
      getYieldRate: jest.fn().mockReturnValue(0.15),
      getTaxation: jest.fn(),
      calculateBalance: jest.fn(),
    } as unknown as PensionPlan,
  ];

  const userProps = {
    id: 'user-1',
    name: 'Lucas Costa',
    cpf: '12345678900',
    email: 'lucas@example.com',
    pensionPlans: mockPensionPlans,
  };

  it('should create a user with all required properties', () => {
    const user = new User(userProps);

    expect(user.id).toBe('user-1');
    expect(user.name).toBe('Lucas Costa');
    expect(user.cpf).toBe('12345678900');
    expect(user.email).toBe('lucas@example.com');
    expect(user.pensionPlans).toHaveLength(2);
  });

  it('should return the correct pension plan when contract number exists', () => {
    const user = new User(userProps);

    const plan = user.getPlan('12345');
    expect(plan).toBeDefined();
    expect(plan?.contractNumber).toBe('12345');
  });

  it('should return undefined when pension plan does not exist', () => {
    const user = new User(userProps);

    const plan = user.getPlan('99999');
    expect(plan).toBeUndefined();
  });
});
