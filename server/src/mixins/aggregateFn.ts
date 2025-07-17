import { ServerException } from '@/exceptions';
import jsonPath from '@/utils/jsonPath';
import {
  ExpressionWrapper,
  sql,
  type AggregateFunctionBuilder,
  type ExpressionBuilder,
  type ReferenceExpression,
} from 'kysely';
import { type DataTypeExpression } from 'kysely/dist/cjs/parser/data-type-parser';
import OverBuilder from './over';

export default class AggregateBuilder {
  private static eb: ExpressionBuilder<any, any>;

  private static resolveColumnExpression<DB, TB extends keyof DB>(
    column: ReferenceExpression<DB, TB> | [keyof DB, () => any],
    pathFn?: () => any,
  ): ReferenceExpression<DB, TB> | any {
    if (Array.isArray(column) && column.length === 2) {
      const [tableName, tablePathFn] = column;
      return jsonPath(tablePathFn, tableName as string);
    }

    if (pathFn) {
      const columnName = typeof column === 'string' ? column : column.toString();
      return jsonPath(pathFn, columnName);
    } else {
      return column;
    }
  }

  private static resolveTwoColumnExpressions<DB, TB extends keyof DB>(
    colY: ReferenceExpression<DB, TB> | [keyof DB, () => any],
    colX: ReferenceExpression<DB, TB> | [keyof DB, () => any],
  ): [ReferenceExpression<DB, TB> | any, ReferenceExpression<DB, TB> | any] {
    return [this.resolveColumnExpression(colY), this.resolveColumnExpression(colX)];
  }

  private static createPercentileExpression<DB, TB extends keyof DB>(
    eb: ExpressionBuilder<DB, TB>,
    fraction: number | number[],
    column: ReferenceExpression<DB, TB>,
    pathFn?: () => any,
  ) {
    const resolvedColumn = this.resolveColumnExpression(column, pathFn);

    const fractionExpression = Array.isArray(fraction)
      ? sql`ARRAY[${sql.join(
          fraction.map(f => sql`CAST(${eb.val(f)} AS NUMERIC)`),
          sql`, `,
        )}]`
      : eb.val(fraction);

    return [fractionExpression, sql.ref(resolvedColumn)];
  }

  private static aggregateMethodList<DB, TB extends keyof DB>() {
    if (!this?.eb) throw new ServerException(500, 'Expression builder missing');
    const eb = this.eb as ExpressionBuilder<DB, TB>;

    return {
      avg: <T = number>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) =>
        this.createChainable<DB, TB>(eb.fn.avg(this.resolveColumnExpression(column, pathFn)), 'float8'),
      sum: <T = number>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) =>
        this.createChainable<DB, TB>(eb.fn.sum(this.resolveColumnExpression(column, pathFn)), 'float8'),
      count: (column: ReferenceExpression<DB, TB> | '*' = '*') =>
        this.createChainable<DB, TB>(
          eb.fn.count(column === '*' ? sql.raw('*') : this.resolveColumnExpression(column)),
          'integer',
        ),
      countDistinct: (column: ReferenceExpression<DB, TB> | '*' = '*') =>
        this.createChainable<DB, TB>(
          column === '*'
            ? (eb.fn<number>('count', [sql.raw('DISTINCT *')]) as any)
            : eb.fn<number>('count', [sql`DISTINCT ${sql.ref(this.resolveColumnExpression(column))}`]),
          'integer',
        ),
      min: <T = number | string | Date>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) =>
        this.createChainable<DB, TB>(eb.fn.min(this.resolveColumnExpression(column, pathFn))),
      max: <T = number | string | Date>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) =>
        this.createChainable<DB, TB>(eb.fn.max(this.resolveColumnExpression(column, pathFn))),
      stddev_samp: <T = number>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) =>
        this.createChainable<DB, TB>(eb.fn('stddev_samp', [this.resolveColumnExpression(column, pathFn)]), 'float8'),
      stddev_pop: <T = number>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) =>
        this.createChainable<DB, TB>(eb.fn('stddev_pop', [this.resolveColumnExpression(column, pathFn)]), 'float8'),
      var_samp: <T = number>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) =>
        this.createChainable<DB, TB>(eb.fn('var_samp', [this.resolveColumnExpression(column, pathFn)]), 'float8'),
      var_pop: <T = number>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) =>
        this.createChainable<DB, TB>(eb.fn('var_pop', [this.resolveColumnExpression(column, pathFn)]), 'float8'),
      corr: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) => this.createChainable<DB, TB>(eb.fn('corr', [...this.resolveTwoColumnExpressions(colY, colX)])),

      covar_pop: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) => this.createChainable<DB, TB>(eb.fn('covar_pop', [...this.resolveTwoColumnExpressions(colY, colX)])),

      covar_samp: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) => this.createChainable<DB, TB>(eb.fn('covar_samp', [...this.resolveTwoColumnExpressions(colY, colX)])),

      regr_avg: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) =>
        this.createChainable<DB, TB>(eb.fn('regr_avgx', [...this.resolveTwoColumnExpressions(colY, colX)]), 'float8'),

      regr_count: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) =>
        this.createChainable<DB, TB>(eb.fn('regr_count', [...this.resolveTwoColumnExpressions(colY, colX)]), 'integer'),

      regr_intercept: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) => this.createChainable<DB, TB>(eb.fn('regr_intercept', [...this.resolveTwoColumnExpressions(colY, colX)])),

      regr_r2: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) => this.createChainable<DB, TB>(eb.fn('regr_r2', [...this.resolveTwoColumnExpressions(colY, colX)])),

      regr_slope: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) => this.createChainable<DB, TB>(eb.fn('regr_slope', [...this.resolveTwoColumnExpressions(colY, colX)])),

      regr_sx: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) => this.createChainable<DB, TB>(eb.fn('regr_syy', [...this.resolveTwoColumnExpressions(colY, colX)])),

      regr_prod: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) => this.createChainable<DB, TB>(eb.fn('regr_sxy', [...this.resolveTwoColumnExpressions(colY, colX)])),

      string_agg: (column: ReferenceExpression<DB, TB> | [keyof DB, () => unknown], separator: string) =>
        this.createChainable<DB, TB>(eb.fn('string_agg', [this.resolveColumnExpression(column), sql.val(separator)])),

      array_agg: (column: ReferenceExpression<DB, TB>, pathFn?: () => unknown) =>
        this.createChainable<DB, TB>(eb.fn('array_agg', [this.resolveColumnExpression(column, pathFn)])),

      json_agg: (column: ReferenceExpression<DB, TB>, pathFn?: () => unknown) =>
        this.createChainable<DB, TB>(eb.fn('jsonb_agg', [this.resolveColumnExpression(column, pathFn)])),

      json_object_agg: (
        colY: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
        colX: ReferenceExpression<DB, TB> | [keyof DB, () => unknown],
      ) => this.createChainable<DB, TB>(eb.fn('jsonb_object_agg', [...this.resolveTwoColumnExpressions(colY, colX)])),

      every: <T extends boolean>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) =>
        this.createChainable<DB, TB>(eb.fn('every', [this.resolveColumnExpression(column, pathFn)])),

      bool_or: <T extends boolean>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) =>
        this.createChainable<DB, TB>(eb.fn('bool_or', [this.resolveColumnExpression(column, pathFn)])),

      mode: <T extends boolean>(column: ReferenceExpression<DB, TB>, pathFn?: () => T) => {
        const expression = new ExpressionWrapper(
          sql`mode() WITHIN GROUP (ORDER BY ${sql.ref(this.resolveColumnExpression(column, pathFn))})`.toOperationNode(),
        );

        return this.createChainable<DB, TB>(expression);
      },

      percentile_cont: <T = number | Date>(
        fraction: number | number[],
        column: ReferenceExpression<DB, TB>,
        pathFn?: () => T,
      ) => {
        const [fractionsValues, columnRef] = this.createPercentileExpression(eb, fraction, column, pathFn);
        const expression = new ExpressionWrapper(
          sql`percentile_cont(${fractionsValues}) WITHIN GROUP (ORDER BY ${columnRef})`.toOperationNode(),
        );

        return this.createChainable<DB, TB>(expression);
      },

      percentile_disc: <T = number | Date>(
        fraction: number | number[],
        column: ReferenceExpression<DB, TB>,
        pathFn?: () => T,
      ) => {
        const [fractionsValues, columnRef] = this.createPercentileExpression(eb, fraction, column, pathFn);
        const expression = new ExpressionWrapper(
          sql`percentile_disc(${fractionsValues}) WITHIN GROUP (ORDER BY ${columnRef})`.toOperationNode(),
        );
        return this.createChainable<DB, TB>(expression);
      },
    };
  }

  private static createChainable<DB, TB extends keyof DB>(
    expr: AggregateFunctionBuilder<DB, TB, any> | ExpressionWrapper<DB, TB, unknown>,
    castType?: DataTypeExpression,
  ): any {
    if (!this?.eb) throw new ServerException(500, 'Expression builder missing');
    const eb = this.eb as ExpressionBuilder<DB, TB>;

    const applyCast = (expression: any) => {
      return castType ? eb.cast(expression, castType) : expression;
    };
    return {
      over: () => OverBuilder.exec(expr, applyCast),
      as: (alias: string) => applyCast(expr).as(alias),
      toOperationNode: () => applyCast(expr).toOperationNode(),
    };
  }

  static exec<DB, TB extends keyof DB>(eb: ExpressionBuilder<DB, TB>) {
    this.eb = eb;
    return this.aggregateMethodList<DB, TB>();
  }
}
