import { WithdrawalsService } from '../../domain/services/withdrawal-service';
import { Money } from '../../domain/value-objects/money';
import { WithdrawalResponseDTO } from '../dtos/withdrawal-dto';
import { PensionPlansRepository } from '../../infra/persistence/repositories/pension-plans.repository';
import { WithdrawalsRepository } from '../../infra/persistence/repositories/withdrawals.repository';
import { UsersRepository } from '../../infra/persistence/repositories/users.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RequestedWithdrawalProducer } from '../../infra/config/rabbitmq/producers/requested-withdrawal.producer';
import { RejectedWithdrawalProducer } from '../../infra/config/rabbitmq/producers/rejected-withdrawal.producer';
import { logger } from '../../infra/config/observability/logger';
import {
  withdrawalProcessingDuration,
  withdrawalRequestedValue,
  withdrawalsRequestedTotal,
} from '../../infra/config/observability/metrics';
import { WithdrawalsMetricsHelper } from '../../infra/config/observability/helpers/metrics.helper';

@Injectable()
export class WithdrawalsRequestUseCase {
  constructor(
    private readonly userRepo: UsersRepository,
    private readonly pensionPlansRepo: PensionPlansRepository,
    private readonly withdrawalsRepo: WithdrawalsRepository,
    private readonly withdrawalsService: WithdrawalsService,
    private readonly requestedWithdrawalProducer: RequestedWithdrawalProducer,
    private readonly rejectedWithdrawalProducer: RejectedWithdrawalProducer,
    private readonly metricsHelper: WithdrawalsMetricsHelper,
  ) {}

  async execute(
    cpf: string,
    requestedValue: Money,
    contractNumber: string,
  ): Promise<WithdrawalResponseDTO> {
    const { span, startTime } = this.metricsHelper.startSpan(
      'WithdrawalsRequestUseCase.execute',
      {
        cpf,
        contractNumber,
        requestedValue: requestedValue.amount,
      },
    );

    try {
      logger.info({
        message: 'Starting withdrawal request',
        cpf,
        contractNumber,
      });
      withdrawalRequestedValue.observe(requestedValue.amount);

      const user = await this.userRepo.findByCpf(cpf);
      if (!user) {
        this.metricsHelper.error(
          withdrawalsRequestedTotal,
          new NotFoundException('User not found'),
          { cpf },
        );
        throw new NotFoundException('User not found');
      }
      const pensionPlan =
        await this.pensionPlansRepo.findByUserIdAndContractNumber(
          user.id,
          contractNumber,
        );

      if (!pensionPlan) {
        this.metricsHelper.error(
          withdrawalsRequestedTotal,
          new NotFoundException('Pension plan not found'),
          { userId: user.id, contractNumber },
        );

        throw new NotFoundException(
          'This contract number does not exist or is not related to this Pension Plan',
        );
      }

      const withdrawalRequest = this.withdrawalsService.request(
        requestedValue,
        pensionPlan,
      );

      const persistSpan =
        this.metricsHelper.startSpan('withdrawal.persist').span;

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
      persistSpan.end();

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
        this.metricsHelper.rejection(
          withdrawalsRequestedTotal,
          withdrawal.rejectionReason!,
          {
            withdrawalId: withdrawal.id,
          },
        );

        this.rejectedWithdrawalProducer.send(basePayload);

        return response;
      }
      this.metricsHelper.success(
        withdrawalsRequestedTotal,
        'Withdrawal approved',
        {
          withdrawalId: withdrawal.id,
        },
      );

      await this.requestedWithdrawalProducer.send(basePayload);
      return response;
    } catch (error) {
      this.metricsHelper.error(withdrawalsRequestedTotal, error, {
        cpf,
        contractNumber,
      });
      throw error;
    } finally {
      this.metricsHelper.endSpan(
        span,
        startTime,
        withdrawalProcessingDuration,
        'WithdrawalsRequestUseCase.execute',
      );
    }
  }
}
