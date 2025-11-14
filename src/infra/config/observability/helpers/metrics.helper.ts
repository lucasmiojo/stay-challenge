import { trace, Span } from '@opentelemetry/api';
import { logger } from '../logger';

export class WithdrawalsMetricsHelper {
  private tracer = trace.getTracer('withdrawals-service');

  startSpan(
    operation: string,
    attributes?: Record<string, any>,
  ): { span: Span; startTime: number } {
    const span = this.tracer.startSpan(operation, { attributes });
    return { span, startTime: Date.now() };
  }

  endSpan(
    span: Span,
    startTime: number,
    histogramMetric?: any,
    operation?: string,
  ) {
    const duration = Date.now() - startTime;
    if (histogramMetric) histogramMetric.observe(duration);
    span.end();
    logger.debug({ message: `Span ${operation} ended`, duration });
  }

  logAndCount(
    metric: any,
    labels: string[],
    level: 'info' | 'warn' | 'error',
    message: string,
    meta?: any,
  ) {
    metric.labels(...labels).inc();
    logger[level]({ message, ...meta });
  }

  success(metric: any, message: string, meta?: any) {
    this.logAndCount(metric, ['confirmed', 'none'], 'info', message, meta);
  }

  rejection(metric: any, reason: string, meta?: any) {
    this.logAndCount(
      metric,
      ['rejected', reason || 'unknown'],
      'warn',
      `Withdrawal rejected - reason: ${reason}`,
      meta,
    );
  }

  error(metric: any, error: any, meta?: any) {
    const reason = error?.message || 'unknown';
    this.logAndCount(
      metric,
      ['error', reason],
      'error',
      `Error during withdrawal ${error}`,
      { ...meta, error },
    );
  }
}
