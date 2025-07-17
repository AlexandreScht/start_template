import { jestSeed, type TestDatabase } from '@/database/seeds/20250624170928_jest';
import { type Plugin } from '@/interfaces/plugins';
import { ConversionType, DateUnit } from '@/mixins/chainableFn';
import { AppDatabase } from '@/plugins';
import { MixinAddons } from '@/plugins/mixins';
// import { logger } from '@/utils/jest_looger';
import { Kysely, PostgresDialect } from 'kysely';
import { type Model, updatedAt } from 'kysely-orm';
import { Pool } from 'pg';

function BaseModel<
  TableName extends keyof TestDatabase & string,
  IdColumn extends keyof TestDatabase[TableName] & string,
>(tableName: TableName, idColumn: IdColumn, db: AppDatabase<TestDatabase>) {
  const Base = db.model(tableName, idColumn);
  const typedBase = Base as unknown as Model<TestDatabase, TableName, IdColumn>;
  const UpdateBase = updatedAt<TestDatabase, TableName, IdColumn, typeof typedBase>(typedBase, 'updated_at');

  const adaptedBase = UpdateBase as unknown as {
    new (...args: any[]): any;
  } & Plugin.MixinAddons.BaseModelInterface<TestDatabase, TableName>;

  return MixinAddons<TestDatabase, TableName, typeof adaptedBase>(adaptedBase);
}

describe('MixinAddons Tests', () => {
  const dialect = new PostgresDialect({
    pool: async () =>
      new Pool({
        host: process.env.TEST_DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || '5432'),
        database: process.env.TEST_DB_NAME || 'template_jest',
        user: process.env.TEST_DB_USER || 'postgres',
        password: process.env.TEST_DB_PASSWORD || 'SinchouEDeaira8!',
      }),
  });

  const ormDb = new AppDatabase<TestDatabase>({ dialect });
  const kyselyDb = new Kysely<TestDatabase>({ dialect });

  // const debugQuery = async <T>(queryBuilder: T & { compile: () => any; execute: () => Promise<any> }) => {
  //   const compiled = queryBuilder.compile();

  //   const startTime = Date.now();
  //   try {
  //     const result = await queryBuilder.execute();
  //     const duration = Date.now() - startTime;

  //     // Log de succès avec toutes les propriétés dans l'objet info
  //     (logger as any).sql('Query executed successfully', {
  //       sql: compiled.sql,
  //       parameters: compiled.parameters,
  //       duration,
  //     });

  //     return result;
  //   } catch (error) {
  //     const duration = Date.now() - startTime;

  //     // Log d'erreur avec les détails de la requête
  //     logger.error('Query execution failed', {
  //       sql: compiled.sql,
  //       parameters: compiled.parameters,
  //       duration,
  //       error: error instanceof Error ? error.message : String(error),
  //       stack: error instanceof Error ? error.stack : undefined,
  //     });

  //     throw error;
  //   }
  // };

  class UsersModel extends BaseModel('users', 'id', ormDb) {
    private data: TestDatabase['users'];

    private constructor(data: TestDatabase['users']) {
      super();
      this.data = data;
    }
  }

  beforeAll(async () => {
    try {
      await jestSeed(kyselyDb);
      console.log('Database seeded successfully for tests.');
    } catch (error) {
      console.error('Failed to seed database:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    await kyselyDb.deleteFrom('users').execute();

    await kyselyDb
      .insertInto('users')
      .values([
        {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
          salary: 50000,
          is_active: true,
          profile: { skills: ['JavaScript', 'TypeScript'], level: 'senior' },
          account: '1 540,50€',
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          age: 25,
          salary: 45000,
          is_active: true,
          profile: { skills: [10, 'Django'], level: 'mid' },
          account: '8 450,99€',
        },
        {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          age: 35,
          salary: 60000,
          is_active: false,
          profile: { skills: ['Marketing', 'SEO'], level: 'senior' },
          account: '6 025,75€',
        },
        {
          name: 'Alice Brown',
          email: 'alice@example.com',
          age: 28,
          salary: 40000,
          is_active: true,
          profile: { skills: ['HR', 'Recruitment'], level: 'junior' },
          account: '1 234,56€',
        },
        {
          name: 'Charlie Wilson',
          email: 'charlie@example.com',
          age: 40,
          salary: 70000,
          is_active: true,
          profile: { skills: ['Management'], level: 'expert' },
          account: '70 200,00€',
        },
        {
          name: 'Eve Nullfield',
          email: 'eve@example.com',
          age: null,
          salary: 48000,
          is_active: true,
          profile: { skills: ['SQL'], level: 'mid' },
          account: '4 800,00€',
        },
      ])
      .execute();
  });

  afterAll(async () => {
    await kyselyDb.schema.dropTable('users').ifExists().execute();
    await kyselyDb.schema.dropTable('departments').ifExists().execute();
    await kyselyDb.destroy();
  });

  describe('selectWhere method', () => {
    test('should select with basic equality criteria', async () => {
      const result = await UsersModel.selectWhere({
        is_active: true,
        age: 30,
      }).execute();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    test('should select with array operator criteria', async () => {
      const result = await UsersModel.selectWhere({
        salary: ['>', 50000],
        is_active: true,
      }).execute();

      expect(result).toHaveLength(1);
      expect(result.map(u => u.name).sort()).toEqual(['Charlie Wilson'].sort());
    });

    test('should select names only with function-based criteria using op method', async () => {
      const result = await UsersModel.selectWhere(['name'], {
        age: ({ op }) => op('>=', 30).and(op('<=', 35)),
      }).execute();

      expect(result).toHaveLength(2);
      expect(result.map(u => u.name).sort()).toEqual(['John Doe', 'Bob Johnson'].sort());
    });
  });

  describe('updateWhere method', () => {
    test('should update with basic criteria', async () => {
      const updateResult = await UsersModel.updateWhere({ is_active: false }, { age: 30 }).execute();

      expect(updateResult[0].numUpdatedRows).toBe(1n);
      const users = await UsersModel.selectWhere({ age: 30, is_active: false }).executeTakeFirst();
      expect(users).toHaveProperty('name', 'John Doe');
    });

    test('should update with array operator criteria', async () => {
      const result = await UsersModel.updateWhere(
        { salary: 70000 },
        {
          salary: ['>=', 60000],
          is_active: false,
        },
      )
        .returning(['name', 'salary'])
        .execute();

      expect(result).toHaveLength(1);
      expect(result.map(u => u.name)).toEqual(['Bob Johnson']);
      expect(result.map(u => u.salary)).toEqual([70000]);
    });

    test('should update with function criteria using betweenSymmetric queryBuilder', async () => {
      const userUpdated = await UsersModel.updateWhere(
        { salary: 55000 },
        {
          age: ({ betweenSymmetric }) => betweenSymmetric(25, 35),
        },
      )
        .returning(['email', 'salary'])
        .execute();

      expect(userUpdated).toHaveLength(4);
      expect(userUpdated.map(u => u.salary)).toEqual([55000, 55000, 55000, 55000]);
      expect(userUpdated.map(u => u.email)).toEqual([
        'john@example.com',
        'jane@example.com',
        'bob@example.com',
        'alice@example.com',
      ]);
    });
  });

  describe('deleteWhere method', () => {
    test('should delete with basic criteria', async () => {
      const deleteResult = await UsersModel.deleteWhere({
        is_active: false,
      }).execute();

      expect(deleteResult).toHaveLength(1);

      const remainingUsers = await UsersModel.selectWhere({ is_active: false }).execute();
      expect(remainingUsers).toHaveLength(0);
    });

    test('should delete with array operator criteria', async () => {
      const deleteResult = await UsersModel.deleteWhere({ name: ['like', 'Alice Brown'] }).execute();
      expect(deleteResult).toHaveLength(1);

      const remainingUsers = await UsersModel.selectWhere({ name: 'Alice Brown' }).execute();
      expect(remainingUsers).toHaveLength(0);
    });

    test('should delete with complex function combinations', async () => {
      await UsersModel.deleteWhere({
        age: ({ between }) => between(25, 40),
      }).execute();

      const remainingUsers = await UsersModel.selectWhere().execute();
      expect(remainingUsers).toHaveLength(1);
      expect(remainingUsers[0].name).toBe('Eve Nullfield');
    });
  });

  describe('QueryBuilder string functions', () => {
    test('QueryBuilder function => op', async () => {
      await UsersModel.deleteWhere({
        name: ({ op }) => op('like', 'John%'),
      }).execute();

      const remainingUsers = await UsersModel.selectWhere().execute();
      expect(remainingUsers).toHaveLength(5);
      expect(remainingUsers).not.toContainEqual(expect.objectContaining({ name: 'John Dae' }));
    });

    test('QueryBuilder function => upper & lower & initcap', async () => {
      const remainingUsers = await UsersModel.selectWhere({
        name: ({ fn, op }) =>
          op(fn.upper(), 'like', 'JOHN%')
            .and(op(fn.lower(), 'like', '%doe'))
            .and(op(fn.initcap(), 'like', 'J%D%')),
      }).execute();

      expect(remainingUsers).toHaveLength(1);
      expect(remainingUsers[0].name).toBe('John Doe');
    });

    test('QueryBuilder function => concat', async () => {
      const users = await UsersModel.selectWhere({
        name: ({ fn, op }) =>
          op(
            fn.concat(col => ['Ms. ', col, ' here']),
            '=',
            'Ms. Bob Johnson here',
          ),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Bob Johnson');
    });

    // test('QueryBuilder function => substring', async () => {
    //   const users = await debugQuery(
    //     UsersModel.selectWhere({
    //       name: ({ fn, op }) => op(fn.substring(1), 'like', 'Jane%'),
    //     }),
    //   );
    //   // .execute();

    //   expect(users).toHaveLength(1);
    //   expect(users[0].name).toBe('Jane Smith');
    // });

    test('QueryBuilder function => left & right', async () => {
      const users = await UsersModel.selectWhere({
        name: ({ fn, op }) => op(fn.left(2), '=', 'Bo').and(op(fn.right(3), '=', 'son')),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Bob Johnson');
    });

    test('QueryBuilder function => trim & ltrim & rtrim', async () => {
      const users = await UsersModel.selectWhere({
        name: ({ fn, op }) =>
          op(fn.trim(), '=', 'Alice Brown')
            .or(op(fn.ltrim(), 'like', 'Charlie%'))
            .or(op(fn.rtrim(), 'like', '%Wilson')),
      }).execute();

      expect(users).toHaveLength(2);
      expect(users.map(u => u.name)).toContain('Alice Brown');
      expect(users.map(u => u.name)).toContain('Charlie Wilson');
    });

    test('QueryBuilder function => replace', async () => {
      const users = await UsersModel.selectWhere({
        name: ({ fn, op }) => op(fn.replace('John', 'Jane'), '=', 'Jane Doe'),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('John Doe');
    });

    test('QueryBuilder function => reverse', async () => {
      const users = await UsersModel.selectWhere({
        name: ({ fn, op }) => op(fn.reverse(), '=', 'htimS enaJ'),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Jane Smith');
    });

    test('QueryBuilder function => repeat', async () => {
      const users = await UsersModel.selectWhere({
        name: ({ fn, op }) => op(fn.repeat(2), '=', 'Bob JohnsonBob Johnson'),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Bob Johnson');
    });

    test('QueryBuilder function => length', async () => {
      const users = await UsersModel.selectWhere({
        name: ({ fn, op }) => op(fn.length(), '>', 10),
      }).execute();

      expect(users).toHaveLength(4);
      expect(users.map(u => u.name)).toContain('Alice Brown');
      expect(users.map(u => u.name)).toContain('Bob Johnson');
      expect(users.map(u => u.name)).toContain('Charlie Wilson');
      expect(users.map(u => u.name)).toContain('Eve Nullfield');
    });

    test('QueryBuilder function => position', async () => {
      const users = await UsersModel.selectWhere({
        name: ({ fn, op }) => op(fn.position('J'), '=', 1),
      }).execute();

      expect(users).toHaveLength(2);
      expect(users.map(u => u.name)).toContain('John Doe');
      expect(users.map(u => u.name)).toContain('Jane Smith');
    });

    test('QueryBuilder function => complex string manipulation combo', async () => {
      const users = await UsersModel.selectWhere({
        name: ({ fn, op }) => op(fn.lower().left(1), '=', 'a').and(op(fn.length(), '=', 11)),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Alice Brown');
    });
  });
  describe('QueryBuilder numeric functions', () => {
    test('QueryBuilder functions => sqrt, ceil, floor, trunc, round', async () => {
      const users = await UsersModel.selectWhere({
        age: ({ fn, op }) =>
          op(fn.sqrt().ceil(), '=', 6)
            .and(op(fn.sqrt().trunc(), '=', 5))
            .and(op(fn.sqrt().round(), 'in', [5, 6])),
      }).execute();

      expect(users).toHaveLength(3);
      const names = users.map(u => u.name);
      expect(names).toContain('John Doe');
      expect(names).toContain('Bob Johnson');
      expect(names).toContain('Alice Brown');
    });

    test('QueryBuilder functions => abs, mod, power, sign', async () => {
      const users = await UsersModel.selectWhere({
        age: ({ fn, op }) => op(fn.abs().mod(7), '=', 0).and(op(fn.power(2), '>', 1000)),
        salary: ({ fn, op }) => op(fn.sign(), '=', 1),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Bob Johnson');
    });
  });
  describe('QueryBuilder trigonometric functions', () => {
    test('QueryBuilder functions => tan', async () => {
      const users = await UsersModel.selectWhere({
        age: ({ fn, op }) => op(fn.tan(), '>', 0),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Bob Johnson');
    });

    test('QueryBuilder functions => sin & cos', async () => {
      const users = await UsersModel.selectWhere({
        age: ({ fn, op }) =>
          op(fn.sin(), '>=', -1)
            .and(op(fn.sin(), '<=', 1))
            .and(op(fn.cos(), '>=', -1))
            .and(op(fn.cos(), '<=', 1)),
      }).execute();

      expect(users).toHaveLength(5);
    });

    test('QueryBuilder functions => asin, acos, atan', async () => {
      const users = await UsersModel.selectWhere({
        age: ({ fn, op }) =>
          op(fn.sin().asin(), '>=', -1.5708)
            .and(op(fn.sin().asin(), '<=', 1.5708))
            .and(op(fn.cos().acos(), '>=', 0))
            .and(op(fn.cos().acos(), '<=', 3.1416))
            .and(op(fn.atan(), '>=', -1.5708))
            .and(op(fn.atan(), '<=', 1.5708)),
      }).execute();

      expect(users).toHaveLength(5);
    });
  });

  describe('QueryBuilder date/time functions', () => {
    test('QueryBuilder functions => current_date', async () => {
      const currentYear = new Date().getFullYear();
      const users = await UsersModel.selectWhere({
        created_at: ({ fn, op }) => op(fn.current_date().date_part(DateUnit.Year), '=', currentYear),
      }).execute();
      expect(users).toHaveLength(6);
    });

    test('QueryBuilder date extraction => month, day', async () => {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const day = new Date().getDate();
      const users = await UsersModel.selectWhere({
        created_at: ({ fn, op }) =>
          op(fn.date_part(DateUnit.Year), '=', year)
            .and(op(fn.month(), '=', month))
            .and(op(fn.day(), '=', day)),
      }).execute();

      expect(users).toHaveLength(6);
    });

    test('QueryBuilder date formatting => date_format', async () => {
      const today = new Date();
      const isoLocal = today.toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }).split(' ')[0];
      const users = await UsersModel.selectWhere({
        created_at: ({ fn, op }) => op(fn.date_format('YYYY-MM-DD'), '=', isoLocal),
      }).execute();

      expect(users).toHaveLength(6);
    });

    test('QueryBuilder date manipulation => date_add, date_sub', async () => {
      const today = new Date();

      const nextYearDate = new Date(today);
      nextYearDate.setFullYear(today.getFullYear() + 1);
      const nextYear = nextYearDate.getFullYear();

      today.setMonth(today.getMonth() - 15);
      const oldMonth = String(today.getMonth() + 1).padStart(2, '0');

      const users = await UsersModel.selectWhere({
        created_at: ({ fn, op }) =>
          op(fn.date_add(1, DateUnit.Year).date_part(DateUnit.Year), '=', nextYear).and(
            op(fn.date_sub(15, DateUnit.Month).date_part(DateUnit.Month), '=', oldMonth),
          ),
      }).execute();

      expect(users).toHaveLength(6);
    });
    test('QueryBuilder functions => current_timestamp, current_time', async () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const users = await UsersModel.selectWhere({
        created_at: ({ fn, op }) =>
          op('<', fn.current_timestamp()).and(op(fn.current_time().date_part(DateUnit.Hour), '=', hours)),
      }).execute();
      expect(users).toHaveLength(6);
    });

    test('QueryBuilder date parts => date_part', async () => {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const users = await UsersModel.selectWhere({
        created_at: ({ fn, op }) =>
          op(fn.date_part(DateUnit.Year), '=', year).and(op(fn.date_part(DateUnit.Month), '=', month)),
      }).execute();
      expect(users).toHaveLength(6);
    });

    test('QueryBuilder date difference => age', async () => {
      const users = await UsersModel.selectWhere({
        created_at: ({ fn, op }) =>
          op(fn.age().date_part(DateUnit.Year), '>=', 0).and(op(fn.age(new Date()).date_part(DateUnit.Day), '>=', 0)),
      }).execute();
      expect(users).toHaveLength(6);
    });
  });
  describe('QueryBuilder conditional functions', () => {
    test('QueryBuilder functions => coalesce, nullif', async () => {
      const usersCoalesce = await UsersModel.selectWhere({
        age: ({ fn, op }) => op(fn.coalesce([() => 'salary', 500]), '=', 48000),
      }).execute();

      expect(usersCoalesce).toHaveLength(1);
      expect(usersCoalesce[0].name).toBe('Eve Nullfield');

      const usersNullif = await UsersModel.selectWhere(['name'], {
        salary: ({ fn, op }) => op(fn.nullif(50000), 'is', null),
      }).execute();

      expect(usersNullif).toHaveLength(1);
      expect(usersNullif[0].name).toBe('John Doe');
    });

    test('QueryBuilder functions => greatest, smallest', async () => {
      const users = await UsersModel.selectWhere(['name'], {
        age: ({ fn, op }) => op(fn.greatest([() => 'salary', 500]), '>', 50000),
        salary: ({ fn, op }) => op(fn.smallest([() => 'age', 500]), '<', 40),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Bob Johnson');
    });
  });
  describe('QueryBuilder type conversion functions', () => {
    test('QueryBuilder functions => convert (cast)', async () => {
      const users = await UsersModel.selectWhere(['name'], {
        age: ({ fn, op }) => op(fn.convert(ConversionType.Text), '=', '35'),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Bob Johnson');
    });
    test('QueryBuilder functions => to_number', async () => {
      const userToNumber = await UsersModel.selectWhere(['name'], {
        account: ({ fn, op }) => op(fn.to_number('99G999D99L'), '>', 7000),
      }).execute();

      expect(userToNumber).toHaveLength(2);
      expect(userToNumber[0].name).toBe('Jane Smith');
      expect(userToNumber[1].name).toBe('Charlie Wilson');
    });
  });

  describe('QueryBuilder JSON functions', () => {
    test('QueryBuilder function => json_extract', async () => {
      const users = await UsersModel.selectWhere(['name'], {
        profile: ({ fn, op }) =>
          op(
            fn.json_get(v => v.skills[0]),
            '=',
            'HR',
          ),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Alice Brown');
    });
    test('QueryBuilder function => json_array_length', async () => {
      const users = await UsersModel.selectWhere(['name'], {
        profile: ({ fn, op }) =>
          op(
            fn.json_array_length(v => v.skills),
            '=',
            1,
          ),
      }).execute();

      expect(users).toHaveLength(2);
      expect(users.map(u => u.name).sort()).toEqual(['Charlie Wilson', 'Eve Nullfield'].sort());
    });
    test('QueryBuilder function => jsonb_typeof', async () => {
      const users = await UsersModel.selectWhere(['name'], {
        profile: ({ fn, op }) =>
          op(
            fn.json_typeof(v => v.skills[0]),
            '=',
            'number',
          ),
      }).execute();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Jane Smith');
    });
  });

  describe('Aggregate Method Tests', () => {
    test('sum & avg of salary', async () => {
      const result = await UsersModel.selectWhere([
        {
          totalSalary: v => v.sum('salary'),
          avgSalary: v => v.avg('salary'),
        },
      ]).execute();

      expect(result).toHaveLength(1);
      expect(result[0].avgSalary).toBeCloseTo(52166.6667, 4);
      expect(result[0].totalSalary).toBe(313000);
    });

    test('count & countDistinct of salary', async () => {
      const result = await UsersModel.selectWhere([
        {
          userCount: v => v.count(),
          distinctSalaries: v => v.countDistinct('salary'),
        },
      ]).execute();

      expect(result).toHaveLength(1);
      expect(result[0].userCount).toBe(6);
      expect(result[0].distinctSalaries).toBe(6);
    });

    test('min & max salary', async () => {
      const result = await UsersModel.selectWhere([
        {
          minSalary: v => v.min('salary'),
          maxSalary: v => v.max('salary'),
        },
      ]).execute();

      expect(result).toHaveLength(1);
      expect(result[0].minSalary).toBe(40000);
      expect(result[0].maxSalary).toBe(70000);
    });

    test('boolean aggregates: every & bool_or on is_active', async () => {
      const result = await UsersModel.selectWhere([
        {
          allActive: v => v.every('is_active'),
          anyActive: v => v.bool_or('is_active'),
        },
      ]).execute();

      expect(result).toHaveLength(1);
      expect(result[0].allActive).toBe(false);
      expect(result[0].anyActive).toBe(true);
    });

    test('array_agg & string_agg of names', async () => {
      const result = await UsersModel.selectWhere([
        {
          namesArray: v => v.array_agg('name'),
          namesString: v => v.string_agg('name', ', '),
        },
      ]).execute();

      expect(result).toHaveLength(1);
      expect(Array.isArray(result[0].namesArray)).toBe(true);
      expect(result[0].namesArray).toHaveLength(6);
      expect(typeof result[0].namesString).toBe('string');
      expect(result[0].namesString.split(', ')).toHaveLength(6);
    });

    test('percentile_cont (median) of salary', async () => {
      const result = await UsersModel.selectWhere([
        {
          medianSalary: v => v.percentile_cont(0.5, 'salary'),
        },
      ]).execute();

      expect(result).toHaveLength(1);
      expect(result[0].medianSalary).toBeCloseTo(49000, 0);
    });
  });
  test('stddev_samp & stddev_pop of salary', async () => {
    const result = await UsersModel.selectWhere([
      {
        sdSample: v => v.stddev_samp('salary'),
        sdPop: v => v.stddev_pop('salary'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(result[0].sdSample).toBeCloseTo(10962.0558, 4);
    expect(result[0].sdPop).toBeCloseTo(10006.942, 4);
  });

  test('var_samp & var_pop of salary', async () => {
    const result = await UsersModel.selectWhere([
      {
        varSample: v => v.var_samp('salary'),
        varPop: v => v.var_pop('salary'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(result[0].varSample).toBeCloseTo(120166666.6667, 4);
    expect(result[0].varPop).toBeCloseTo(100138888.8889, 4);
  });

  test('correlation of age & salary', async () => {
    const result = await UsersModel.selectWhere([
      {
        ageSalaryCorr: v => v.corr('age', 'salary'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(result[0].ageSalaryCorr).toBeCloseTo(0.9469737612, 4);
  });

  test('covariance population & sample of age & salary', async () => {
    const result = await UsersModel.selectWhere([
      {
        covPop: v => v.covar_pop('age', 'salary'),
        covSample: v => v.covar_samp('age', 'salary'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(result[0].covPop).toBe(54200);
    expect(result[0].covSample).toBe(67750);
  });
  test('regr_avg (avgx) & regr_count of salary vs age', async () => {
    const result = await UsersModel.selectWhere([
      {
        avgAge: v => v.regr_avg('salary', 'age'),
        pairCount: v => v.regr_count('salary', 'age'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(result[0].avgAge).toBeCloseTo(31.6, 1);
    expect(result[0].pairCount).toBe(5);
  });

  test('regr_slope & regr_intercept of salary vs age', async () => {
    const result = await UsersModel.selectWhere([
      {
        slope: v => v.regr_slope('salary', 'age'),
        intercept: v => v.regr_intercept('salary', 'age'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(result[0].slope).toBeCloseTo(1919.2635, 4);
    expect(result[0].intercept).toBeCloseTo(-7648.7252, 4);
  });

  test('regr_r2 of salary vs age', async () => {
    const result = await UsersModel.selectWhere([
      {
        rSquared: v => v.regr_r2('salary', 'age'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(result[0].rSquared).toBeCloseTo(0.8967593, 6);
  });

  test('regr_sx (syy) & regr_prod (sxy) of salary vs age', async () => {
    const result = await UsersModel.selectWhere([
      {
        sumDeviations: v => v.regr_sx('salary', 'age'),
        sumCross: v => v.regr_prod('salary', 'age'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(result[0].sumDeviations).toBe(580000000);
    expect(result[0].sumCross).toBe(271000);
  });
  test('json_agg of names & json_object_agg of email→salary', async () => {
    const result = await UsersModel.selectWhere([
      {
        namesJson: v => v.json_agg('name'),
        salaryByEmail: v => v.json_object_agg('email', 'salary'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(Array.isArray(result[0].namesJson)).toBe(true);
    expect(result[0].namesJson).toHaveLength(6);
    expect(result[0].namesJson).toContain('John Doe');
    expect(typeof result[0].salaryByEmail).toBe('object');
    expect(Object.keys(result[0].salaryByEmail)).toHaveLength(6);
    expect(result[0].salaryByEmail['bob@example.com']).toBe(60000);
  });

  test('mode of is_active', async () => {
    const result = await UsersModel.selectWhere([
      {
        mostCommonActive: v => v.mode('is_active'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(result[0].mostCommonActive).toBe(true);
  });

  test('percentile_disc (0.5) of salary', async () => {
    const result = await UsersModel.selectWhere([
      {
        medianSalaryDisc: v => v.percentile_disc(0.5, 'salary'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(result[0].medianSalaryDisc).toBe(48000);
  });

  test('percentile_disc ([0.25, 0.75]) of salary', async () => {
    const result = await UsersModel.selectWhere([
      {
        quartilesSalary: v => v.percentile_disc([0.25, 0.75], 'salary'),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    expect(Array.isArray(result[0].quartilesSalary)).toBe(true);
    expect(result[0].quartilesSalary).toEqual([45000, 60000]);
  });
  test('json_agg on profile column', async () => {
    const result = await UsersModel.selectWhere([
      {
        levelsJson: v => v.json_agg('profile', p => p.level),
      },
    ]).execute();

    expect(result).toHaveLength(1);
    const { levelsJson } = result[0];
    expect(Array.isArray(levelsJson)).toBe(true);
    expect(levelsJson).toHaveLength(6);
    expect(levelsJson).toEqual(expect.arrayContaining(['senior', 'mid', 'senior', 'junior', 'expert', 'mid']));
  });
  describe('Window Function Tests', () => {
    test('over', async () => {
      const result = await UsersModel.selectWhere([
        'name',
        {
          totalSalary: v => v.sum('salary').over(),
        },
      ]).execute();

      expect(result).toHaveLength(6);
      result.forEach(r => {
        expect(r).toHaveProperty('name');
        expect(r.totalSalary).toBe(313000);
      });
    });
    test('partitionBy', async () => {
      const result = await UsersModel.selectWhere([
        'name',
        {
          partitionCount: v => v.count().over().partitionBy(['is_active']),
        },
      ]).execute();

      expect(result).toHaveLength(6);

      const trueNames = ['John Doe', 'Jane Smith', 'Alice Brown', 'Charlie Wilson', 'Eve Nullfield'];
      const falseNames = ['Bob Johnson'];

      trueNames.forEach(n => {
        const row = result.find(r => r.name === n);
        expect(row?.partitionCount).toBe(5);
      });
      falseNames.forEach(n => {
        const row = result.find(r => r.name === n);
        expect(row?.partitionCount).toBe(1);
      });
    });

    test('orderBy', async () => {
      const result = await UsersModel.selectWhere([
        'salary',
        {
          cumSum: v => v.sum('salary').over().orderBy(['salary']),
        },
      ]).execute();

      const sorted = [...result].sort((a, b) => a.salary - b.salary);
      const sums = sorted.map(r => r.cumSum);
      expect(sums).toEqual([40000, 85000, 133000, 183000, 243000, 313000]);
    });

    test('rows', async () => {
      const result = await UsersModel.selectWhere([
        'salary',
        {
          movSum: v =>
            v
              .sum('salary')
              .over()
              .orderBy(['salary'])
              .rows({ between: ['preceding', 1], and: ['current row'] }),
        },
      ]).execute();

      const sorted = [...result].sort((a, b) => a.salary - b.salary);
      const sums = sorted.map(r => r.movSum);
      expect(sums).toEqual([40000, 85000, 93000, 98000, 110000, 130000]);
    });

    test('range', async () => {
      const result = await UsersModel.selectWhere([
        'salary',
        {
          rangeCount: v =>
            v
              .count()
              .over()
              .orderBy(['salary'])
              .range({ between: ['preceding', 10000], and: ['current row'] }),
        },
      ]).execute();

      const sorted = [...result].sort((a, b) => a.salary - b.salary);
      const counts = sorted.map(r => r.rangeCount);
      expect(counts).toEqual([1, 2, 3, 4, 2, 2]);
    });

    test('groups', async () => {
      const result = await UsersModel.selectWhere([
        'salary',
        {
          grpSum: v =>
            v
              .sum('salary')
              .over()
              .orderBy(['salary'])
              .groups({ between: ['preceding', 1], and: ['current row'] }),
        },
      ]).execute();

      const sorted = [...result].sort((a, b) => a.salary - b.salary);
      const sums = sorted.map(r => r.grpSum);
      expect(sums).toEqual([40000, 85000, 93000, 98000, 110000, 130000]);
    });
    test('exclude', async () => {
      const result = await UsersModel.selectWhere([
        'name',
        {
          excludedSum: v =>
            v
              .sum('salary')
              .over()
              .partitionBy(['is_active'])
              .orderBy(['salary'])
              .rows({ between: ['unbounded preceding'], and: ['unbounded following'] })
              .exclude('current row'),
        },
      ]).execute();

      const sums = result.reduce<Record<string, number | null>>((acc, r) => {
        acc[r.name] = r.excludedSum;
        return acc;
      }, {});

      expect(sums['John Doe']).toBe(253000 - 50000);
      expect(sums['Jane Smith']).toBe(253000 - 45000);
      expect(sums['Alice Brown']).toBe(253000 - 40000);
      expect(sums['Charlie Wilson']).toBe(253000 - 70000);
      expect(sums['Eve Nullfield']).toBe(253000 - 48000);

      expect(sums['Bob Johnson']).toBeNull();
    });
    test('json', async () => {
      const result = await UsersModel.selectWhere([
        'name',
        {
          levelOrderCount: v =>
            v
              .count()
              .over()
              .partitionBy([{ profile: x => x.level }])
              .orderBy(['age']),
        },
      ]).execute();

      const counts: Record<string, number> = {};
      result.forEach(r => {
        counts[r.name] = r.levelOrderCount;
      });

      expect(counts['John Doe']).toBe(1);
      expect(counts['Bob Johnson']).toBe(2);
      expect(counts['Jane Smith']).toBe(1);
      expect(counts['Eve Nullfield']).toBe(2);
      expect(counts['Alice Brown']).toBe(1);
      expect(counts['Charlie Wilson']).toBe(1);
    });
  });
});
