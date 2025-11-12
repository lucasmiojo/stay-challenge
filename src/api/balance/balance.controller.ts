import { Controller, Get, Param } from '@nestjs/common';
import { CheckBalanceUseCase } from '../../application/use-cases/check-balance.use-case';

@Controller('users/:cpf/balance/:contractNumber')
export class BalanceController {
  constructor(private readonly useCase: CheckBalanceUseCase) {}

  @Get()
  async getBalance(
    @Param('cpf') cpf: string,
    @Param('contractNumber') contractNumber: string,
  ) {
    return this.useCase.execute(cpf, contractNumber);
  }
}
