import { type __aggregateType } from '@/types/symbols';
import type {
  AggregateChain,
  AggregateMethodsHelper,
  ComparisonOperatorExpression,
  CriteriaExpressionBuilder,
  DeleteQueryBuilder,
  DeleteResult,
  ExpressionBuilder,
  FinalizedSQL,
  OverAfterBetween,
  OverAfterOrder,
  OverStart,
  Selectable,
  SelectQueryBuilder,
  sqlMethod,
  UpdateQueryBuilder,
  UpdateResult,
} from 'kysely';
import { type UpdateObjectExpression } from 'kysely/dist/cjs/parser/update-set-parser';

export namespace Plugin {
  type BaseModelConstructor<DB, TB extends keyof DB> = {
    new (...args: any[]): any;
  } & Plugin.MixinAddons.BaseModelInterface<DB, TB>;

  namespace MixinAddons {
    type Criteria<DB, TB extends keyof DB> = Partial<{
      [C in keyof DB[TB]]:
        | DB[TB][C]
        | [ComparisonOperatorExpression, DB[TB][C]]
        | ((qb: CriteriaExpressionBuilder<DB, TB, DB[TB][C]>) => any);
    }>;

    type SelectQueryBuilderWithoutBaseMethods<DB, TB extends keyof DB, O> = Omit<
      SelectQueryBuilder<DB, TB, O>,
      'select' | 'selectAll' | 'where'
    >;

    type ConfigItem<T> =
      | keyof T
      | {
          [Alias: string]: (v: AggregateMethodsHelper<T>) => any;
        };

    type ExtractNormalColumns<T, Config extends readonly ConfigItem<T>[]> = {
      [K in keyof Config]: Config[K] extends keyof T ? Config[K] : never;
    }[number];

    type ExtractAggregateReturn<T> =
      T extends AggregateChain<infer U, any>
        ? U
        : T extends OverStart<infer U, any, any>
          ? U
          : T extends OverAfterOrder<infer U>
            ? U
            : T extends OverAfterBetween<infer U>
              ? U
              : T extends sqlMethod<infer U>
                ? U
                : T extends FinalizedSQL<infer U>
                  ? U
                  : T extends { [__aggregateType]: infer U }
                    ? U
                    : T;

    type ExtractAggregateColumns<T, Config extends readonly ConfigItem<T>[]> = UnionToIntersection<
      {
        [I in keyof Config]: Config[I] extends { [Alias in string]: (v: AggregateMethodsHelper<T>) => any }
          ? { [Alias in keyof Config[I]]: ExtractAggregateReturn<ReturnType<Config[I][Alias]>> }
          : never;
      }[number]
    >;

    type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

    type NormalColumns<T, Config extends readonly ConfigItem<T>[]> = RemoveOptionalUndefined<{
      [P in ExtractNormalColumns<T, Config>]: T[P];
    }>;
    type SelectResult<T, Config extends readonly ConfigItem<T>[]> = NormalColumns<T, Config> &
      UnionToIntersection<
        {
          [I in keyof Config]: Config[I] extends { [Alias in string]: (v: AggregateMethodsHelper<T>) => any }
            ? { [Alias in keyof Config[I]]: ExtractAggregateReturn<ReturnType<Config[I][Alias]>> }
            : never;
        }[number]
      >;

    type RemoveOptionalUndefined<T> = {
      [K in keyof T]-?: undefined extends T[K] ? Exclude<T[K], undefined> : T[K];
    };

    interface BaseModelInterface<DB, TB extends keyof DB> {
      selectFrom(): SelectQueryBuilder<DB, TB, Selectable<DB[TB]>>;
      updateTable(): UpdateQueryBuilder<DB, TB, TB, UpdateResult>;
      deleteFrom(): DeleteQueryBuilder<DB, TB, DeleteResult>;
    }

    interface MixinBase<DB, TB extends keyof DB> {
      _buildWhereClause(criteria: Plugin.MixinAddons.Criteria<DB, TB>): (eb: ExpressionBuilder<DB, TB>) => any;

      /**
       * Selects columns from the table based on the provided criteria.
       *
       * @param columns the columns to select. Can be undefined to select all columns
       * @param criteria the criteria to apply
       *
       * ### Example
       * ```ts
       * ::: (columns: undefined, criteria: undefined)
       *  //*→ SELECT *
       *  BaseModel.selectWhere()
       *
       * ::: (columns: undefined, criteria: 5)
       *  //*→ SELECT * WHERE id = 5
       *  BaseModel.selectWhere({ id: 5 })
       *
       * ::: (columns: ['id', 'name'], criteria: >5)
       *  //*→ SELECT id, name WHERE id > 5
       *  BaseModel.selectWhere(['id', 'name'], { id: [">", 5] })
       *
       * ::: (columns: ['name'], criteria: queryBuilderFunction)
       *  //*→ SELECT name WHERE TOTAL(id) > 5
       *  BaseModel.selectWhere(['name'], { id: ({ fn, op }) => op(fn("sum"), ">", 5) })
       * ```
       */
      selectWhere(
        criteria?: Plugin.MixinAddons.Criteria<DB, TB>,
      ): SelectQueryBuilderWithoutBaseMethods<DB, TB, RemoveOptionalUndefined<DB[TB]>>;
      selectWhere<const Config extends readonly ConfigItem<DB[TB]>[]>(
        columns: Config,
        criteria?: Plugin.MixinAddons.Criteria<DB, TB>,
      ): SelectQueryBuilderWithoutBaseMethods<DB, TB, SelectResult<DB[TB], Config>>;

      /**
       * Updates columns from the table based on the provided criteria.
       *
       * @param set update the value of the column
       * @param criteria the criteria to apply
       *
       * ### Example
       * ```ts
       * ::: (set: id=10, criteria: undefined)
       *  //*→ UPDATE ID = 10 ( for all rows )
       *  BaseModel.updateWhere({ id: 10 })
       *
       * ::: (set: name, criteria: id>5)
       *  //*→ UPDATE name = 'Oliver' WHERE id > 5
       *  BaseModel.updateWhere({ name: 'Oliver' }, { id: [">", 5] })
       *
       * ::: (set: name, criteria: queryBuilderFunction)
       *  //*→ UPDATE name = 'Oliver' WHERE TOTAL(id) > 5
       *  BaseModel.updateWhere({ name: 'Oliver' }, { id: ({ fn, op }) => op(fn("sum"), ">", 5) })
       * ```
       */
      updateWhere(
        columns: UpdateObjectExpression<DB, TB, TB>,
        criteria?: Plugin.MixinAddons.Criteria<DB, TB>,
      ): Omit<UpdateQueryBuilder<DB, TB, TB, UpdateResult>, 'set' | 'where'>;

      /**
       * Delete rows from the table based on the provided criteria.
       *
       * @param criteria the criteria to apply
       *
       * ### Example
       * ```ts
       * ::: (criteria: undefined)
       *  //*→ DELETE *
       *  BaseModel.deleteWhere()
       *
       * ::: (criteria: id>5)
       *  //*→ DELETE WHERE id > 5
       *  BaseModel.deleteWhere({ id: [">", 5] })
       *
       * ::: (criteria: queryBuilderFunction)
       *  //*→ DELETE WHERE TOTAL(id) > 5
       *  BaseModel.deleteWhere({ id: ({ fn, op }) => op(fn("sum"), ">", 5) })
       * ```
       */
      deleteWhere(
        criteria: Plugin.MixinAddons.Criteria<DB, TB>,
      ): Omit<DeleteQueryBuilder<DB, TB, DeleteResult>, 'where'>;
    }
  }
}
