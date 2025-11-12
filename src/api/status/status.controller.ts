import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { StatusResponseDTO } from '../../application/dtos/status-dto';
import { CheckStatusUseCase } from '../../application/use-cases/check-status.use-case';

@Controller('status/:transactionId')
export class StatusController {
  constructor(private readonly useCase: CheckStatusUseCase) {}

  @Get()
  async getStatus(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ): Promise<StatusResponseDTO[]> {
    return this.useCase.execute(transactionId);
  }
}
