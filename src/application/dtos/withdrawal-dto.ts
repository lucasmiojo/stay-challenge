import { Withdrawals } from 'src/domain/entities/withdrawal';
import { Money } from 'src/domain/value-objects/money';

export class CreateWithdrawalDTO {
  requestedValue: number;
  contractNumber: string;
}

export class WithdrawalResponseDTO {
  transactionId: string;
  requestedValue: number;
  redeemableValue: number;
  requestDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  rejectionReason?: string;
}

export class WithdrawalConfirmationResponseDTO {
  id: string;
  transactionId: string;
  pensionPlanId: string;
  requestedValue: Money;
  requestDate: Date;
  redeemableValue: Money;
  rejectionReason?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  confirmationDate?: Date;

  static fromEntity(
    withdrawal: Withdrawals,
  ): WithdrawalConfirmationResponseDTO {
    return {
      id: withdrawal.id,
      transactionId: withdrawal.transactionId,
      pensionPlanId: withdrawal.pensionPlanId,
      requestDate: withdrawal.requestDate,
      status: withdrawal.status,
      rejectionReason: withdrawal.rejectionReason,
      requestedValue: withdrawal.requestedValue,
      redeemableValue: withdrawal.redeemableValue,
    };
  }
}
