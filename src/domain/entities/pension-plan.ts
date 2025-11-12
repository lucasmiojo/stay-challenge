import { Balance } from '../value-objects/balance';
import { Grace } from '../value-objects/grace';
import { Money } from '../value-objects/money';
import { TaxationStrategyFactory } from '../value-objects/taxation/taxation-factory';
import { Contributions } from './contributions';
import { Withdrawals } from './withdrawal';

const YIELD = 0.2;

export class PensionPlan {
  readonly id: string;
  readonly type: 'PGBL' | 'VGBL';
  readonly contractNumber: string;
  readonly startDate: Date;
  readonly contributions: Contributions[];
  readonly withdrawals: Withdrawals[];
  constructor({
    id,
    type,
    contractNumber,
    startDate,
    contributions,
    withdrawals,
  }) {
    this.id = id;
    this.type = type;
    this.contractNumber = contractNumber;
    this.startDate = startDate;
    this.contributions = contributions;
    this.withdrawals = withdrawals;
  }

  getYieldRate() {
    return YIELD;
  }

  getTaxation() {
    return TaxationStrategyFactory.create(this.type);
  }

  /*
    saldoTotal == soma de todas as contribuições

    saldoDisponivel == filtrar as contribuições disponíveis

    saldoNãoDisponivel == saldoTotal - saldoDisponivel

    carencias == filtrar as contribuições não disponiveis (!saldoDisponivel)

    total resgatado == filtrar todos os regates com status CONFIRMED
  */
  calculateBalance() {
    const yieldFactor = 1 + this.getYieldRate();

    // calcular o valor total acumulado de todas as contribuições do plano.
    let totalBalance = this.contributions.reduce((acc, contribution) => {
      const valueWithYield = contribution.money.multiplyBy(yieldFactor);
      return acc.sumValues(valueWithYield);
    }, new Money(0));

    // somar só as contribuições que já estão liberadas para resgate
    let availableBalance = this.contributions
      .filter((contribution) => contribution.isAvailable())
      .reduce(
        (acc, contribution) => acc.sumValues(contribution.money),
        new Money(0),
      );

    // objetos de carencia -> cada parte do saldo que está bloqueada e sua data de liberação
    const grace = this.contributions.filter((contribution) =>
      contribution.isUnavailable(),
    );

    // determinar a parte do saldo que está bloqueada (em carência).
    const notAvailableBalance = grace.reduce((acc, contribution) => {
      const valueWithYield = contribution.money.multiplyBy(yieldFactor);
      return acc.sumValues(valueWithYield);
    }, new Money(0));

    const graceResponse = grace.map(
      (contribution) =>
        new Grace(
          contribution.money.multiplyBy(yieldFactor),
          contribution.availabilityDate,
        ),
    );

    // somar todos os resgates já efetivados (já pagos/abatidos do saldo).
    const totalWithdrawn = this.withdrawals
      .filter((withdrawal) => {
        return withdrawal.status == 'CONFIRMED';
      })
      .reduce(
        (acc, withdrawal) => acc.sumValues(withdrawal.redeemableValue),
        new Money(0),
      );

    // saldo total líquido (todas as contribuições menos o que já foi resgatado).
    totalBalance = totalBalance.subtractValues(totalWithdrawn);

    // saldo disponível líquido (o que estava disponível menos o que já foi resgatado
    availableBalance = availableBalance.subtractValues(totalWithdrawn);

    return new Balance(
      totalBalance,
      availableBalance,
      notAvailableBalance,
      graceResponse,
    );
  }
}
