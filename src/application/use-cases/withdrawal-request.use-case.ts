import { WithdrawalsService } from '../../domain/services/withdrawal-service';
import { Money } from '../../domain/value-objects/money';
import { WithdrawalResponseDTO } from '../dtos/withdrawal-dto';
import { PensionPlansRepository } from '../../infra/persistence/repositories/pension-plans.repository';
import { WithdrawalsRepository } from '../../infra/persistence/repositories/withdrawals.repository';
import { UsersRepository } from '../../infra/persistence/repositories/users.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestedWithdrawalProducer } from '../../infra/config/rabbitmq/producers/requested-withdrawal.producer';
import { RejectedWithdrawalProducer } from '../../infra/config/rabbitmq/producers/rejected-withdrawal.producer';

@Injectable()
export class WithdrawalsRequestUseCase {
  constructor(
    private readonly userRepo: UsersRepository,
    private readonly pensionPlansRepo: PensionPlansRepository,
    private readonly withdrawalsRepo: WithdrawalsRepository,
    private readonly withdrawalsService: WithdrawalsService,
    private readonly requestedWithdrawalProducer: RequestedWithdrawalProducer,
    private readonly rejectedWithdrawalProducer: RejectedWithdrawalProducer,
  ) {}

  async execute(
    cpf: string,
    requestedValue: Money,
    contractNumber: string,
  ): Promise<WithdrawalResponseDTO> {
    const user = await this.userRepo.findByCpf(cpf);
    if (!user) throw new NotFoundException('User not found');

    const pensionPlan =
      await this.pensionPlansRepo.findByUserIdAndContractNumber(
        user.id,
        contractNumber,
      );

    if (!pensionPlan)
      throw new NotFoundException(
        'This contract number does not exist or is not related to this Pension Plan',
      );

    // add um log

    const withdrawalRequest = this.withdrawalsService.request(
      requestedValue,
      pensionPlan,
    );

    const withdrawal = await this.withdrawalsRepo.createWithdrawal({
      id: withdrawalRequest.id,
      transactionId: withdrawalRequest.transactionId,
      pensionPlanId: withdrawalRequest.pensionPlanId,
      requestedValue: withdrawalRequest.requestedValue.amount,
      redeemableValue: withdrawalRequest.redeemableValue.amount,
      requestDate: withdrawalRequest.requestDate,
      status: withdrawalRequest.status,
      rejectionReason: withdrawalRequest.rejectionReason,
    });

    const basePayload = {
      cpf: user.cpf,
      transactionId: withdrawal.transactionId,
      pensionPlanId: withdrawal.pensionPlanId,
      contractNumber,
      withdrawalId: withdrawal.id,
      value: withdrawal.requestedValue.amount,
      redeemableValue: withdrawal.redeemableValue.amount,
      requestDate: withdrawal.requestDate.toISOString().split('T')[0],
      rejectionReason: withdrawal.rejectionReason,
    };

    const response: WithdrawalResponseDTO = {
      transactionId: withdrawal.transactionId,
      requestedValue: withdrawal.requestedValue.amount,
      redeemableValue: withdrawal.redeemableValue.amount,
      requestDate: basePayload.requestDate,
      status: withdrawal.status,
      rejectionReason: withdrawal.rejectionReason,
    };

    if (withdrawalRequest.isRejected()) {
      this.rejectedWithdrawalProducer.send(basePayload);

      return response;
    }

    await this.requestedWithdrawalProducer.send(basePayload);
    return response;
  }
}
