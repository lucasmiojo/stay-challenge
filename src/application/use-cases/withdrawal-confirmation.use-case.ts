import { UsersRepository } from '../../infra/persistence/repositories/users.repository';
import { PensionPlansRepository } from '../../infra/persistence/repositories/pension-plans.repository';
import { WithdrawalsRepository } from '../../infra/persistence/repositories/withdrawals.repository';
import { Withdrawals } from '../../domain/entities/withdrawal';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RejectedWithdrawalProducer } from '../../infra/config/rabbitmq/producers/rejected-withdrawal.producer';
import { WithdrawalConfirmationResponseDTO } from '../dtos/withdrawal-dto';
import { v4 as uuidv4 } from 'uuid';
import {
  withdrawalConfirmationDuration,
  withdrawalConfirmationTotal,
} from '../../infra/config/observability/metrics';
import { logger } from '../../infra/config/observability/logger';
import { WithdrawalsMetricsHelper } from '../../infra/config/observability/helpers/metrics.helper';

@Injectable()
export class WithdrawalsConfirmationUseCase {
  constructor(
    private readonly userRepo: UsersRepository,
    private readonly pensionPlansRepo: PensionPlansRepository,
    private readonly withdrawalsRepo: WithdrawalsRepository,
    private readonly rejectedWithdrawalProducer: RejectedWithdrawalProducer,
    private readonly metricsHelper: WithdrawalsMetricsHelper,
  ) {}

  async execute({
    withdrawalId,
    transactionId,
    cpf,
    contractNumber,
  }: {
    withdrawalId: string;
    transactionId: string;
    cpf: string;
    contractNumber: string;
  }): Promise<WithdrawalConfirmationResponseDTO> {
    const { span, startTime } = this.metricsHelper.startSpan(
      'WithdrawalsConfirmationUseCase.execute',
      { cpf, contractNumber, transactionId },
    );

    try {
      logger.info({
        message: 'Starting withdrawal confirmation',
        cpf,
        contractNumber,
        transactionId,
      });

      const user = await this.userRepo.findByCpf(cpf);
      if (!user) {
        this.metricsHelper.error(
          withdrawalConfirmationTotal,
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
          withdrawalConfirmationTotal,
          new NotFoundException('Pension plan not found'),
          { userId: user.id, contractNumber },
        );
        throw new NotFoundException(
          'This contract number does not exist or is not related to this Pension Plan',
        );
      }

      const withdrawal = pensionPlan.withdrawals.find(
        (withdrawal) => withdrawal.id == withdrawalId,
      );

      if (!withdrawal) {
        this.metricsHelper.error(
          withdrawalConfirmationTotal,
          new NotFoundException('Withdrawal not found'),
          { withdrawalId },
        );
        throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);
      }

      const persistWithdrawal = async (wwithdrawal: Withdrawals) => {
        return this.withdrawalsRepo.createWithdrawal({
          id: uuidv4(),
          transactionId,
          pensionPlanId: wwithdrawal.pensionPlanId,
          requestDate: wwithdrawal.requestDate,
          status: wwithdrawal.status,
          rejectionReason: wwithdrawal.rejectionReason,
          requestedValue: wwithdrawal.requestedValue.amount,
          redeemableValue: wwithdrawal.redeemableValue.amount,
        });
      };

      // // sub-span: salvar no repositório
      const persistSpan =
        this.metricsHelper.startSpan('withdrawal.persist').span;

      if (withdrawal && withdrawal.isConfirmed()) {
        const reason = `Withdrawal ${withdrawalId} has already been confirmed`;
        withdrawal.reject(reason);

        this.metricsHelper.rejection(withdrawalConfirmationTotal, reason, {
          withdrawalId,
        });
        logger.warn({
          message: 'Withdrawal already confirmed',
          withdrawalId,
          transactionId,
        });

        await persistWithdrawal(withdrawal);
        persistSpan.end();

        this.rejectedWithdrawalProducer.send({
          cpf: user.cpf,
          transactionId,
          pensionPlanId: withdrawal.pensionPlanId,
          contractNumber: contractNumber,
          withdrawalId: withdrawal.id,
          value: withdrawal.requestedValue.amount,
          redeemableValue: withdrawal.redeemableValue.amount,
          requestDate: withdrawal.requestDate.toISOString().split('T')[0],
        });

        throw new ConflictException(reason);
      }

      withdrawal!.confirm();

      this.metricsHelper.success(
        withdrawalConfirmationTotal,
        'Withdrawal confirmed',
        {
          withdrawalId,
        },
      );

      await persistWithdrawal(withdrawal!);
      persistSpan.end();

      logger.info({
        message: 'Withdrawal confirmed successfully',
        withdrawalId: withdrawal.id,
        transactionId: withdrawal.transactionId,
      });
      return WithdrawalConfirmationResponseDTO.fromEntity(withdrawal);
    } catch (error) {
      this.metricsHelper.error(withdrawalConfirmationTotal, error, {
        cpf,
        contractNumber,
        transactionId,
      });
      throw error;
    } finally {
      this.metricsHelper.endSpan(
        span,
        startTime,
        withdrawalConfirmationDuration,
      );
    }
  }
}
