import { StatusController } from '../../../../api/status/status.controller';
import { CheckStatusUseCase } from '../../../../application/use-cases/check-status.use-case';
import { StatusResponseDTO } from '../../../../application/dtos/status-dto';

describe('StatusController', () => {
  let controller: StatusController;
  let useCase: jest.Mocked<CheckStatusUseCase>;

  beforeEach(() => {
    useCase = { execute: jest.fn() } as any;
    controller = new StatusController(useCase);
    jest.clearAllMocks();
  });

  it('should call useCase.execute with transactionId and return the result', async () => {
    const mockTransactionId = 'b9a1a3d8-2e4b-4b6e-9d2b-6d9a88b7d8e0';
    const mockResponse: StatusResponseDTO[] = [
      {
        transactionId: 'tx-123',
        pensionPlanId: 'plan-1',
        requestedValue: 1000,
        redeemableValue: 900,
        requestDate: '2024-01-01T00:00:00.000Z',
        status: 'CONFIRMED',
        rejectionReason: undefined,
      },
    ];

    useCase.execute.mockResolvedValueOnce(mockResponse);

    const result = await controller.getStatus(mockTransactionId);

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(useCase.execute).toHaveBeenCalledWith(mockTransactionId);
    expect(result).toEqual(mockResponse);
  });

  it('should propagate errors thrown by the use case', async () => {
    const transactionId = 'b9a1a3d8-2e4b-4b6e-9d2b-6d9a88b7d8e0';
    useCase.execute.mockRejectedValueOnce(new Error('Transaction not found'));

    await expect(controller.getStatus(transactionId)).rejects.toThrow(
      'Transaction not found',
    );
  });
});
