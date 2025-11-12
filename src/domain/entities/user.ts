import { PensionPlan } from './pension-plan';

export class User {
  readonly id: string;
  readonly name: string;
  readonly cpf: string;
  readonly email: string;
  readonly pensionPlans: PensionPlan[] = [];
  constructor({ id, name, cpf, email, pensionPlans }) {
    this.id = id;
    this.name = name;
    this.cpf = cpf;
    this.email = email;
    this.pensionPlans = pensionPlans;
  }
  getPlan(contractNumber: string): PensionPlan | undefined {
    return this.pensionPlans.find(
      (pensionPlan) => pensionPlan.contractNumber === contractNumber,
    );
  }
}
