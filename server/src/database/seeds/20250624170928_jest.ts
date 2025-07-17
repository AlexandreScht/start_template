import { sql, type Kysely } from 'kysely';

interface JSONB {
  users_profile: {
    skills: (string | number)[];
    level: 'senior' | 'junior' | 'mid' | 'expert';
  };
}

export interface TestDatabase {
  users: {
    id?: number;
    name?: string;
    email: string;
    age: number | null;
    salary: number;
    is_active: boolean;
    profile: JSONB['users_profile'] | object | null;
    account: string | null;
    department_id: number | null;
    updated_at?: number | string | Date;
    created_at?: number | string | Date;
  };
}
// replace `any` with your database interface.
export async function jestSeed(db: Kysely<TestDatabase>): Promise<void> {
  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar(255)', col => col.notNull())
    .addColumn('email', 'varchar(255)', col => col.notNull().unique())
    .addColumn('age', 'integer')
    .addColumn('salary', 'integer', col => col.notNull())
    .addColumn('account', 'varchar(255)', col => col.notNull())
    .addColumn('created_at', 'timestamp', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('is_active', 'boolean', col => col.notNull().defaultTo(true))
    .addColumn('profile', 'jsonb', col => col.notNull())
    .execute();
}
