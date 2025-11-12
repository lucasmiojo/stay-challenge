import { Injectable } from '@nestjs/common';
import { PensionPlan } from '../entities/pension-plan';
import { Withdrawals } from '../entities/withdrawal';
import { Money } from '../value-objects/money';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WithdrawalsService {
  request(requestedValue: Money, pensionPlan: PensionPlan): Withdrawals {
    const balance = pensionPlan.calculateBalance();
    const available = balance.available;
    const taxation = pensionPlan.getTaxation();

    if (requestedValue.amount > available.amount) {
      return this.createWithdrawal({
        pensionPlan,
        requestedValue,
        redeemableValue: available,
        status: 'REJECTED',
        rejectionReason: 'Requested value is higher than the available',
      });
    }

    // Caso contrário, calcula o valor líquido após impostos
    const redeemableValue = taxation.applyTax({
      requestedValue,
      totalContributed: available,
    });

    return this.createWithdrawal({
      pensionPlan,
      requestedValue,
      redeemableValue,
      status: 'PENDING',
    });
  }

  private createWithdrawal({
    pensionPlan,
    requestedValue,
    redeemableValue,
    status,
    rejectionReason,
  }: {
    pensionPlan: PensionPlan;
    requestedValue: Money;
    redeemableValue: Money;
    status: 'PENDING' | 'REJECTED';
    rejectionReason?: string;
  }): Withdrawals {
    return new Withdrawals({
      id: uuidv4(),
      pensionPlanId: pensionPlan.id,
      requestedValue,
      redeemableValue,
      requestDate: new Date(),
      status,
      confirmationDate: undefined,
      rejectionReason,
      transactionId: uuidv4(),
    });
  }
}
