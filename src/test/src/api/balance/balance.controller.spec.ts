import { BalanceController } from '../../../../api/balance/balance.controller';
import { CheckBalanceUseCase } from '../../../../application/use-cases/check-balance.use-case';
import { BalanceDTO } from '../../../../application/dtos/balance-dto';

describe('BalanceController', () => {
  let controller: BalanceController;
  let useCase: jest.Mocked<CheckBalanceUseCase>;

  beforeEach(() => {
    useCase = { execute: jest.fn() } as any;
    controller = new BalanceController(useCase);
    jest.clearAllMocks();
  });

  it('should call useCase.execute with cpf and contractNumber and return BalanceDTO', async () => {
    const mockCpf = '12345678900';
    const mockContractNumber = 'CN123';

    const mockResponse: BalanceDTO = {
      total: 1000,
      available: 800,
      notAvailable: 200,
      graces: [
        { value: 200, availabilityDate: '2024-12-01' },
        { value: 100, availabilityDate: '2025-01-01' },
      ],
    };

    useCase.execute.mockResolvedValueOnce(mockResponse);

    const result = await controller.getBalance(mockCpf, mockContractNumber);

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(useCase.execute).toHaveBeenCalledWith(mockCpf, mockContractNumber);
    expect(result).toEqual(mockResponse);
  });

  it('should propagate errors from useCase', async () => {
    useCase.execute.mockRejectedValueOnce(new Error('User not found'));

    await expect(controller.getBalance('99999999999', 'CN999')).rejects.toThrow(
      'User not found',
    );
  });
});
