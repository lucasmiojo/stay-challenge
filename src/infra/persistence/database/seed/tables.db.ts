export const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  email VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS pension_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(10) NOT NULL,
  contract_number VARCHAR(30) NOT NULL,
  start_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY,
  pension_plan_id UUID REFERENCES pension_plans(id),
  value INTEGER NOT NULL,
  start_date DATE NOT NULL,
  availability_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY,
  pension_plan_id UUID REFERENCES pension_plans(id),
  requested_value INTEGER NOT NULL,
  redeemable_value INTEGER NOT NULL,
  request_date DATE NOT NULL,
  confirmation_date DATE,
  status VARCHAR(20) NOT NULL,
  rejection_reason TEXT,
  transaction_id UUID NOT NULL
);
`;
