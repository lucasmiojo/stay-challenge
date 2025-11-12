import { Money } from '../value-objects/money';

export class Withdrawals {
  readonly id: string;
  readonly transactionId: string;
  readonly pensionPlanId: string;
  readonly requestedValue: Money;
  readonly requestDate: Date;
  private _redeemableValue: Money;
  private _rejectionReason?: string;
  private _status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  private _confirmationDate?: Date;
  constructor({
    id,
    transactionId,
    pensionPlanId,
    requestedValue,
    redeemableValue,
    requestDate,
    status,
    confirmationDate,
    rejectionReason,
  }: {
    id: string;
    transactionId: string;
    pensionPlanId: string;
    requestedValue: Money;
    redeemableValue: Money;
    requestDate: Date;
    rejectionReason?: string;
    status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
    confirmationDate?: Date;
  }) {
    this.id = id;
    this.transactionId = transactionId;
    this.pensionPlanId = pensionPlanId;
    this.requestedValue = requestedValue;
    this.requestDate = requestDate;
    this._status = status;
    this._redeemableValue = redeemableValue;
    this._confirmationDate = confirmationDate;
    this._rejectionReason = rejectionReason;
  }

  public get status(): 'PENDING' | 'CONFIRMED' | 'REJECTED' {
    return this._status;
  }

  public get redeemableValue(): Money {
    return this._redeemableValue;
  }

  public get confirmationDate(): Date | undefined {
    return this._confirmationDate;
  }

  public get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }

  isRejected(): boolean {
    return this.status === 'REJECTED';
  }

  isAvailable(): boolean {
    return new Date() >= this.requestDate;
  }

  isConfirmed(): boolean {
    return this._status === 'CONFIRMED';
  }

  confirm(): void {
    this._status = 'CONFIRMED';
    this._confirmationDate = new Date();
  }

  reject(reason: string): void {
    this._status = 'REJECTED';
    this._rejectionReason = reason;
  }
}
