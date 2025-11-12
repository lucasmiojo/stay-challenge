import { PensionPlan } from '../entities/pension-plan';
import { Contributions } from '../entities/contributions';
import { Money } from '../value-objects/money';
import { Withdrawals } from '../entities/withdrawal';

export class PensionPlanFactory {
  static createFromDb(row: any): PensionPlan {
    const contributions = (row.contributions || []).map(
      (contribution: any) =>
        new Contributions({
          id: contribution.id,
          money: new Money(contribution.value),
          startDate: new Date(contribution.start_date),
          availabilityDate: new Date(contribution.availability_date),
        }),
    );

    const withdrawals = (row.withdrawals || []).map((withdrawal: any) => {
      return new Withdrawals({
        id: withdrawal.id,
        transactionId: withdrawal.transaction_id,
        pensionPlanId: withdrawal.pension_plan_id,
        requestedValue: new Money(withdrawal.requested_value),
        redeemableValue: new Money(withdrawal.redeemable_value),
        requestDate: withdrawal.request_date,
        status: withdrawal.status,
        confirmationDate: withdrawal.confirmation_date,
        rejectionReason: withdrawal.rejection_reason,
      });
    });

    return new PensionPlan({
      id: row.id,
      type: row.type,
      contractNumber: row.contract_number,
      startDate: new Date(row.start_date),
      contributions: contributions,
      withdrawals: withdrawals,
    });
  }
}
