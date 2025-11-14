/* OpenTelemetry bootstrap for Node.js (basic) */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// enable basic diagnostics (optional)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

try {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
      concurrencyLimit: 1,
      timeoutMillis: 3000,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  console.log('OpenTelemetry initialized');
} catch (err: any) {
  console.error(
    'OpenTelemetry failed to start, continuing anyway:',
    err.message,
  );
}

// const sdk = new NodeSDK({
//   traceExporter: exporter,
//   instrumentations: [getNodeAutoInstrumentations()],
// });

// try {
//   sdk.start();
//   console.log('OpenTelemetry initialized');
// } catch (error) {
//   console.error('OpenTelemetry failed to start', error);
// }

// gracefully shutdown on process end
