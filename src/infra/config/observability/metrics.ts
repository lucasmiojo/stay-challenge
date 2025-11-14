import client from 'prom-client';

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 300, 500, 1000, 2000],
});

export const totalHttpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const withdrawalsRequestedTotal = new client.Counter({
  name: 'withdrawals_requested_total',
  help: 'Total number of withdrawal requests received',
  labelNames: ['status', 'reason'],
});

export const withdrawalProcessingDuration = new client.Histogram({
  name: 'withdrawal_processing_duration_ms',
  help: 'Duration of withdrawal processing in milliseconds',
  buckets: [50, 100, 250, 500, 1000, 2000, 5000],
});

export const withdrawalRequestedValue = new client.Summary({
  name: 'withdrawal_requested_value',
  help: 'Distribution of requested withdrawal values',
  percentiles: [0.5, 0.9, 0.99],
});

export const withdrawalConfirmationDuration = new client.Histogram({
  name: 'withdrawal_confirmation_duration_ms',
  help: 'Duration (em miliseconds) to confirm withdrawal',
  labelNames: ['status'],
});

// Conta quantas confirmações foram processadas
export const withdrawalConfirmationTotal = new client.Counter({
  name: 'withdrawal_confirmation_total',
  help: 'Withdrawals confirmation total number',
  labelNames: ['status', 'reason'],
});

export const metricsMiddleware = async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
};
