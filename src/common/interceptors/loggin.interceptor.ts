import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { context, trace } from '@opentelemetry/api';
import { logger } from '../../infra/config/observability/logger';
import {
  httpRequestDuration,
  totalHttpRequests,
} from '../../infra/config/observability/metrics';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(contextExec: ExecutionContext, next: CallHandler): Observable<any> {
    const req = contextExec.switchToHttp().getRequest();
    const res = contextExec.switchToHttp().getResponse();

    const method = req.method;
    const url = req.url;
    const traceId =
      trace.getSpan(context.active())?.spanContext().traceId || uuidv4();
    const startTime = Date.now();

    logger.info('Incoming request', { method, url, traceId, body: req.body });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const status = res.statusCode;

          logger.info('Request success', {
            method,
            url,
            traceId,
            status,
            duration,
          });

          httpRequestDuration
            .labels(method, url, String(status))
            .observe(duration);
          totalHttpRequests.labels(method, url, String(status)).inc();
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          const status = res.statusCode || 500;

          logger.error('Request error', {
            method,
            url,
            traceId,
            status,
            duration,
            error: err.message,
          });

          httpRequestDuration
            .labels(method, url, String(status))
            .observe(duration);
          totalHttpRequests.labels(method, url, String(status)).inc();
        },
      }),
    );
  }
}
