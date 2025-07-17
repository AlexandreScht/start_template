import { ServicesError } from '@/exceptions';
import jsonPath from '@/utils/jsonPath';
import {
  type AggregateFunctionBuilder,
  type BetweenOrder,
  type BoundaryTuple,
  type ExpressionWrapper,
  type OrderByExpression,
  type RawBuilder,
  type ReferenceExpression,
  sql,
} from 'kysely';

type JsonPathFunction = () => unknown;
type JsonColumnExpression<DB, TB extends keyof DB> =
  | ReferenceExpression<DB, TB>
  | { [K in keyof DB[TB]]?: JsonPathFunction };
type ColumnOrJsonExpression<DB, TB extends keyof DB> = ReferenceExpression<DB, TB> | JsonColumnExpression<DB, TB>;

export default class OverBuilder<DB, TB extends keyof DB> {
  private _parts: RawBuilder<any>[] = [];
  private _baseExpr: AggregateFunctionBuilder<DB, TB, any> | ExpressionWrapper<DB, TB, unknown>;
  private constructor(expr: AggregateFunctionBuilder<DB, TB, any> | ExpressionWrapper<DB, TB, unknown>) {
    this._baseExpr = expr;
  }
  private buildExpression(): RawBuilder<any> {
    const overClause = this._parts.length > 0 ? sql.join(this._parts, sql.raw(' ')) : sql.raw('');

    return sql`${this._baseExpr} OVER (${overClause})`;
  }

  private buildBoundaryClause(boundary: BoundaryTuple): RawBuilder<any> {
    if (['preceding', 'following'].includes(boundary[0])) {
      if (!boundary[1]) {
        throw new ServicesError('Required number boundary type in index 1');
      }
      return sql`${sql.lit(boundary[1])} ${sql.raw(boundary[0].toUpperCase())}`;
    } else if (['unbounded preceding', 'unbounded following', 'current row'].includes(boundary[0])) {
      return sql.raw(boundary[0].toUpperCase());
    }
    throw new ServicesError(`Invalid boundary type: ${boundary[0]}`);
  }

  private extractJsonColumn(col: ColumnOrJsonExpression<DB, TB>): RawBuilder<any> {
    if (typeof col === 'object' && col !== null) {
      const parts = Object.entries(col).reduce((acc, [columnName, pathFn]) => {
        if (typeof pathFn !== 'function')
          throw new ServicesError(`Invalid JSON path mapping for column "${columnName}"`);
        acc.push(jsonPath(pathFn, columnName));
        return acc;
      }, [] as RawBuilder<any>[]);

      if (parts.length === 1) return parts[0];

      return sql`(${sql.join(parts, sql.raw(', '))})`;
    }
    throw new ServicesError('Invalid argument in JSON column method');
  }

  static exec<DB, TB extends keyof DB>(
    expr: AggregateFunctionBuilder<DB, TB, any> | ExpressionWrapper<DB, TB, unknown>,
    applyCast: (expression: any) => any,
  ): RawBuilder<any> {
    const inst = new OverBuilder(expr);

    const makeRaw = () => inst.buildExpression();

    const builder: any = {};

    builder.partitionBy = (cols: ReferenceExpression<DB, TB> | ReferenceExpression<DB, TB>[]) => {
      const arr = Array.isArray(cols) ? cols : [cols];
      const refs = arr.map(col => (typeof col === 'string' ? sql.ref(col) : inst.extractJsonColumn(col as any)));
      inst._parts.push(sql`PARTITION BY ${sql.join(refs, sql.raw(', '))}`);
      return builder;
    };

    builder.orderBy = (cols: OrderByExpression<DB, TB, never> | OrderByExpression<DB, TB, never>[]) => {
      const arr = Array.isArray(cols) ? cols : [cols];
      const refs = arr.map(col => (typeof col === 'string' ? sql.ref(col) : inst.extractJsonColumn(col as any)));
      inst._parts.push(sql`ORDER BY ${sql.join(refs, sql.raw(', '))}`);
      return builder;
    };

    builder.rows = (arg: BetweenOrder) => {
      const b = inst.buildBoundaryClause(arg.between);
      const a = inst.buildBoundaryClause(arg.and);
      inst._parts.push(sql`ROWS BETWEEN ${b} AND ${a}`);
      return builder;
    };
    builder.range = (arg: BetweenOrder) => {
      const b = inst.buildBoundaryClause(arg.between);
      const a = inst.buildBoundaryClause(arg.and);
      inst._parts.push(sql`RANGE BETWEEN ${b} AND ${a}`);
      return builder;
    };
    builder.groups = (arg: BetweenOrder) => {
      const b = inst.buildBoundaryClause(arg.between);
      const a = inst.buildBoundaryClause(arg.and);
      inst._parts.push(sql`GROUPS BETWEEN ${b} AND ${a}`);
      return builder;
    };

    builder.exclude = (cond: 'current row' | 'group' | 'ties') => {
      const allowed = ['current row', 'group', 'ties'];
      if (!allowed.includes(cond)) {
        throw new Error(`Invalid exclude condition: ${cond}`);
      }
      inst._parts.push(sql.raw(`EXCLUDE ${cond.toUpperCase()}`));
      return builder;
    };

    builder.exec = () => applyCast(makeRaw());

    builder.toOperationNode = () => applyCast(makeRaw()).toOperationNode();
    builder.as = (alias: string) => applyCast(makeRaw()).as(alias);
    return builder as ReturnType<typeof OverBuilder.exec>;
  }
}
