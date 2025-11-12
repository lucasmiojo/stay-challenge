import { Injectable, NotFoundException } from '@nestjs/common';
import { WithdrawalsRepository } from '../../infra/persistence/repositories/withdrawals.repository';
import { StatusResponseDTO } from '../dtos/status-dto';

@Injectable()
export class CheckStatusUseCase {
  constructor(private readonly withdrawalsRepo: WithdrawalsRepository) {}

  async execute(transactionId: string): Promise<StatusResponseDTO[]> {
    const withdrawalsHistory =
      await this.withdrawalsRepo.findByTransactionId(transactionId);

    if (withdrawalsHistory.length == 0)
      throw new NotFoundException('Transactions not found');
    return withdrawalsHistory.map(StatusResponseDTO.fromEntity);
  }
}
