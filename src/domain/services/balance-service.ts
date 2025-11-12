import { Injectable } from '@nestjs/common';
import { PensionPlan } from '../entities/pension-plan';
import { Balance } from '../value-objects/balance';

@Injectable()
export class BalanceService {
  calculateBalance(pensionPlan: PensionPlan): Balance {
    return pensionPlan.calculateBalance();
  }
}
