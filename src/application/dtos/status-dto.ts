import { Withdrawals } from 'src/domain/entities/withdrawal';

export class StatusResponseDTO {
  transactionId: string;
  pensionPlanId: string;
  requestedValue: number;
  redeemableValue: number;
  requestDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  rejectionReason?: string;

  static fromEntity(withdrawal: Withdrawals): StatusResponseDTO {
    return {
      transactionId: withdrawal.transactionId,
      pensionPlanId: withdrawal.pensionPlanId,
      requestedValue: withdrawal.requestedValue.amount,
      redeemableValue: withdrawal.redeemableValue.amount,
      requestDate: withdrawal.requestDate.toISOString(),
      status: withdrawal.status,
      rejectionReason: withdrawal.rejectionReason,
    };
  }
}
