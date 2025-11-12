import { pgPool } from '../postgres/postgres.client';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  const client = await pgPool.connect();
  try {
    console.log('Starting seed process...');
    await client.query('BEGIN');

    // --- USERS ---------------------------------------------------------------
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (Number(userCount.rows[0].count) === 0) {
      console.log('Seeding users...');
      const user1Id = uuidv4();
      const user2Id = uuidv4();
      const user3Id = uuidv4();

      await client.query(
        `
        INSERT INTO users (id, name, cpf, email)
        VALUES
          ($1, $2, $3, $4),
          ($5, $6, $7, $8),
          ($9, $10, $11, $12)
        `,
        [
          user1Id,
          'Lucas Costa',
          '02070893103',
          'lucas@teste.com',
          user2Id,
          'Marina Silva',
          '73591246085',
          'marina@teste.com',
          user3Id,
          'André Rocha',
          '48971235019',
          'andre@teste.com',
        ],
      );
      console.log('Users seeded successfully');
    } else {
      console.log('Users already exist — skipping.');
    }

    // Recupera usuários existentes
    const users = await client.query('SELECT * FROM users');
    const userByName = (name: string) =>
      users.rows.find((u) => u.name === name)?.id;

    // --- PENSION PLANS ------------------------------------------------------
    const planCount = await client.query('SELECT COUNT(*) FROM pension_plans');
    if (Number(planCount.rows[0].count) === 0) {
      console.log('Seeding pension plans...');

      const plan1Id = uuidv4();
      const plan2Id = uuidv4();
      const plan3Id = uuidv4();
      const plan4Id = uuidv4();

      await client.query(
        `
        INSERT INTO pension_plans (id, user_id, type, contract_number, start_date)
        VALUES
          ($1, $2, 'PGBL', '12345', '2024-01-01'),
          ($3, $2, 'VGBL', '67890', '2023-06-01'),
          ($4, $5, 'PGBL', '55555', '2023-03-10'),
          ($6, $7, 'VGBL', '99999', '2022-09-15')
        `,
        [
          plan1Id,
          userByName('Lucas Costa'),
          plan2Id,
          plan3Id,
          userByName('Marina Silva'),
          plan4Id,
          userByName('André Rocha'),
        ],
      );
      console.log('Pension plans seeded successfully');
    } else {
      console.log('Pension plans already exist — skipping.');
    }

    const plans = await client.query('SELECT * FROM pension_plans');
    const planByUser = (userName: string) =>
      plans.rows.filter((plan) => plan.user_id === userByName(userName));

    // --- CONTRIBUTIONS ------------------------------------------------------
    const contribCount = await client.query(
      'SELECT COUNT(*) FROM contributions',
    );
    if (Number(contribCount.rows[0].count) === 0) {
      console.log('Seeding contributions...');

      const contributions = [
        [
          uuidv4(),
          planByUser('Lucas Costa')[0]?.id,
          500000,
          '2024-01-10',
          '2024-03-10',
        ],
        [
          uuidv4(),
          planByUser('Lucas Costa')[0]?.id,
          300000,
          '2024-06-05',
          '2025-01-01',
        ],
        [
          uuidv4(),
          planByUser('Lucas Costa')[0]?.id,
          700000,
          '2025-01-20',
          '2025-09-01',
        ],
        [
          uuidv4(),
          planByUser('Lucas Costa')[1]?.id,
          200000,
          '2023-07-01',
          '2023-08-01',
        ],
        [
          uuidv4(),
          planByUser('Lucas Costa')[1]?.id,
          150000,
          '2023-09-10',
          '2024-01-10',
        ],
        [
          uuidv4(),
          planByUser('Marina Silva')[0]?.id,
          800000,
          '2023-03-15',
          '2024-03-15',
        ],
        [
          uuidv4(),
          planByUser('Marina Silva')[0]?.id,
          500000,
          '2024-05-01',
          '2025-05-01',
        ],
        [
          uuidv4(),
          planByUser('Marina Silva')[0]?.id,
          30000,
          '2024-05-01',
          '2025-12-01',
        ],
        [
          uuidv4(),
          planByUser('André Rocha')[0]?.id,
          400000,
          '2022-09-20',
          '2022-11-20',
        ],
      ];

      for (const [
        id,
        planId,
        value,
        startDate,
        availabilityDate,
      ] of contributions) {
        if (!planId) continue;
        await client.query(
          `
          INSERT INTO contributions (id, pension_plan_id, value, start_date, availability_date)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [id, planId, value, startDate, availabilityDate],
        );
      }

      console.log('Contributions seeded successfully');
    } else {
      console.log('Contributions already exist — skipping.');
    }

    // --- WITHDRAWALS --------------------------------------------------------
    const withdrawCount = await client.query(
      'SELECT COUNT(*) FROM withdrawals',
    );
    if (Number(withdrawCount.rows[0].count) === 0) {
      console.log('Seeding withdrawals...');

      const withdrawals: any[] = [];

      // Lucas - Plano 1
      {
        const transaction1 = uuidv4(); // mesmo saque em 2 estágios (PENDING → CONFIRMED)
        const transaction2 = uuidv4(); // outro saque (PENDING → REJECTED)

        // PENDING
        withdrawals.push([
          uuidv4(),
          planByUser('Lucas Costa')[0]?.id,
          200000,
          180000,
          '2025-09-10',
          null,
          'PENDING',
          null,
          transaction1,
        ]);

        // CONFIRMED
        withdrawals.push([
          uuidv4(),
          planByUser('Lucas Costa')[0]?.id,
          200000,
          180000,
          '2025-09-10',
          '2025-09-15',
          'CONFIRMED',
          null,
          transaction1,
        ]);

        // PENDING
        withdrawals.push([
          uuidv4(),
          planByUser('Lucas Costa')[0]?.id,
          300000,
          270000,
          '2025-10-10',
          null,
          'PENDING',
          null,
          transaction2,
        ]);

        // REJECTED
        withdrawals.push([
          uuidv4(),
          planByUser('Lucas Costa')[0]?.id,
          300000,
          270000,
          '2025-10-10',
          '2025-10-12',
          'REJECTED',
          'Valor indisponível para resgate',
          transaction2,
        ]);
      }

      // Marina
      {
        const transaction3 = uuidv4();

        withdrawals.push([
          uuidv4(),
          planByUser('Marina Silva')[0]?.id,
          100000,
          95000,
          '2024-12-01',
          null,
          'PENDING',
          null,
          transaction3,
        ]);

        withdrawals.push([
          uuidv4(),
          planByUser('Marina Silva')[0]?.id,
          100000,
          95000,
          '2024-12-01',
          '2024-12-05',
          'CONFIRMED',
          null,
          transaction3,
        ]);
      }

      // André
      {
        const transaction4 = uuidv4();

        withdrawals.push([
          uuidv4(),
          planByUser('André Rocha')[0]?.id,
          150000,
          150000,
          '2023-01-15',
          null,
          'PENDING',
          null,
          transaction4,
        ]);

        withdrawals.push([
          uuidv4(),
          planByUser('André Rocha')[0]?.id,
          150000,
          150000,
          '2023-01-15',
          '2023-01-20',
          'CONFIRMED',
          null,
          transaction4,
        ]);
      }

      for (const [
        id,
        planId,
        requestedValue,
        redeemableValue,
        reqDate,
        confDate,
        status,
        reason,
        transactionId,
      ] of withdrawals) {
        if (!planId) continue;
        await client.query(
          `
      INSERT INTO withdrawals
        (id, pension_plan_id, requested_value, redeemable_value, request_date, confirmation_date, status, rejection_reason, transaction_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
          [
            id,
            planId,
            requestedValue,
            redeemableValue,
            reqDate,
            confDate,
            status,
            reason,
            transactionId,
          ],
        );
      }

      console.log('Withdrawals seeded successfully');
    } else {
      console.log('Withdrawals already exist — skipping.');
    }

    await client.query('COMMIT');
    console.log('Database fully seeded!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during seeding:', error);
  } finally {
    client.release();
  }
}
