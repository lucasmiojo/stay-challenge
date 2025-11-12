import { WithdrawalsController } from '../../../../api/withdrawal/withdrawal.controller';
import { WithdrawalsRequestUseCase } from '../../../../application/use-cases/withdrawal-request.use-case';
import {
  CreateWithdrawalDTO,
  WithdrawalResponseDTO,
} from '../../../../application/dtos/withdrawal-dto';
import { Money } from '../../../../domain/value-objects/money';
import { NotFoundException } from '@nestjs/common';

describe('WithdrawalsController', () => {
  let controller: WithdrawalsController;
  let useCase: jest.Mocked<WithdrawalsRequestUseCase>;

  beforeEach(() => {
    useCase = { execute: jest.fn() } as any;
    controller = new WithdrawalsController(useCase);
    jest.clearAllMocks();
  });

  it('should call useCase.execute with correct params and return the response', async () => {
    const cpf = '12345678900';
    const body: CreateWithdrawalDTO = {
      requestedValue: 1000,
      contractNumber: 'CNTR-001',
    };

    const expectedResponse: WithdrawalResponseDTO = {
      transactionId: 'tx-123',
      requestedValue: 1000,
      requestDate: '2025-11-11',
      status: 'PENDING',
      rejectionReason: undefined,
    };

    useCase.execute.mockResolvedValueOnce(expectedResponse);

    const result = await controller.requestWithdrawal(cpf, body);

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(useCase.execute).toHaveBeenCalledWith(
      cpf,
      expect.any(Money),
      body.contractNumber,
    );

    const moneyArg = (useCase.execute as jest.Mock).mock.calls[0][1];

    expect(moneyArg.amount).toBe(Money.fromReais(body.requestedValue).amount);

    expect(result).toEqual(expectedResponse);
  });

  it('should propagate NotFoundException when user is not found', async () => {
    const cpf = '99999999999';
    const body: CreateWithdrawalDTO = {
      requestedValue: 100,
      contractNumber: 'INVALID',
    };

    useCase.execute.mockRejectedValueOnce(
      new NotFoundException('User not found'),
    );

    await expect(controller.requestWithdrawal(cpf, body)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should propagate NotFoundException when contract number is invalid', async () => {
    const cpf = '12345678900';
    const body: CreateWithdrawalDTO = {
      requestedValue: 500,
      contractNumber: 'WRONG-CNTR',
    };

    useCase.execute.mockRejectedValueOnce(
      new NotFoundException('This contract number does not exist'),
    );

    await expect(controller.requestWithdrawal(cpf, body)).rejects.toThrow(
      NotFoundException,
    );
  });
});
