import { Controller, Post, Param, Body } from '@nestjs/common';
import {
  CreateWithdrawalDTO,
  WithdrawalResponseDTO,
} from '../../application/dtos/withdrawal-dto';
import { WithdrawalsRequestUseCase } from '../../application/use-cases/withdrawal-request.use-case';
import { Money } from '../../domain/value-objects/money';

@Controller('users/:cpf/withdrawals')
export class WithdrawalsController {
  constructor(private readonly usecase: WithdrawalsRequestUseCase) {}

  @Post()
  async requestWithdrawal(
    @Param('cpf') cpf: string,
    @Body() body: CreateWithdrawalDTO,
  ): Promise<WithdrawalResponseDTO> {
    return await this.usecase.execute(
      cpf,
      Money.fromReais(body.requestedValue),
      body.contractNumber,
    );
  }
}
