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

@Injectable()
export class WithdrawalsConfirmationUseCase {
  constructor(
    private readonly userRepo: UsersRepository,
    private readonly pensionPlansRepo: PensionPlansRepository,
    private readonly withdrawalsRepo: WithdrawalsRepository,
    private readonly rejectedWithdrawalProducer: RejectedWithdrawalProducer,
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

    const withdrawal = pensionPlan.withdrawals.find(
      (withdrawal) => withdrawal.id == withdrawalId,
    );

    if (!withdrawal)
      throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);

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

    if (withdrawal && withdrawal.isConfirmed()) {
      const reason = `Withdrawal ${withdrawalId} has already been done`;

      withdrawal.reject(reason);
      await persistWithdrawal(withdrawal);

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
    // add um log

    withdrawal!.confirm();

    await persistWithdrawal(withdrawal!);

    return WithdrawalConfirmationResponseDTO.fromEntity(withdrawal);
  }
}
