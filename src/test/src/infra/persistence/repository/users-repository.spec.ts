import { UsersRepository } from '../../../../../infra/persistence/repositories/users.repository';
import { pgPool } from '../../../../../infra/persistence/database/postgres/postgres.client';

jest.mock(
  '../../../../../infra/persistence/database/postgres/postgres.client',
  () => ({
    pgPool: { query: jest.fn() },
    connectPostgres: jest.fn(),
  }),
);

describe('UsersRepository', () => {
  let repository: UsersRepository;

  beforeEach(() => {
    repository = new UsersRepository();
    jest.clearAllMocks();
  });

  it('should return a user when found by CPF', async () => {
    const fakeUser = {
      id: '123',
      name: 'Lucas Costa',
      cpf: '12345678900',
      email: 'lucas@example.com',
    };

    (pgPool.query as jest.Mock).mockResolvedValueOnce({ rows: [fakeUser] });

    const result = await repository.findByCpf(fakeUser.cpf);

    expect(pgPool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE cpf = $1',
      [fakeUser.cpf],
    );
    expect(result).toEqual(fakeUser);
  });

  it('should return null when no user is found', async () => {
    (pgPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

    const result = await repository.findByCpf('99999999999');

    expect(pgPool.query).toHaveBeenCalledWith(
      'SELECT * FROM users WHERE cpf = $1',
      ['99999999999'],
    );
    expect(result).toBeNull();
  });
});
