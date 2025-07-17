import { type Plugin } from '@/interfaces/plugins';
import AggregateBuilder from '@/mixins/aggregateFn';
import WhereClauseBuilder from '@/mixins/whereClause';
import { type ExpressionBuilder } from 'kysely';
// import { type ExpressionBuilder } from 'kysely';
import { type UpdateObjectExpression } from 'kysely/dist/cjs/parser/update-set-parser';

export function MixinAddons<DB, TB extends keyof DB, TBase extends Plugin.BaseModelConstructor<DB, TB>>(
  Base: TBase,
): TBase & {
  new (...args: any[]): InstanceType<TBase>;
} & Plugin.MixinAddons.MixinBase<DB, TB> {
  class MixinClass extends Base {
    static selectWhere(
      columnsOrCriteria?: (keyof DB[TB])[] | Plugin.MixinAddons.Criteria<DB, TB>,
      criteria?: Plugin.MixinAddons.Criteria<DB, TB>,
    ) {
      if (Array.isArray(columnsOrCriteria)) {
        const columns = columnsOrCriteria;
        const hasAggregates = columns.some(col => typeof col === 'object' && col !== null && typeof col !== 'string');

        const select = hasAggregates
          ? (eb: ExpressionBuilder<DB, TB>) =>
              columns.flatMap(col => {
                if (typeof col === 'string') {
                  return [col];
                } else if (typeof col === 'object' && col !== null) {
                  return Object.entries(col).map(([alias, fnBuilder]: [string, any]) =>
                    fnBuilder(AggregateBuilder.exec(eb)).as(alias),
                  );
                }
                return [];
              })
          : (columns as any);

        if (!criteria) {
          return this.selectFrom().select(select);
        }
        const whereFn = WhereClauseBuilder.exec(criteria);
        return this.selectFrom().select(select).where(whereFn);
      }

      const actualCriteria = columnsOrCriteria as Plugin.MixinAddons.Criteria<DB, TB> | undefined;
      if (!actualCriteria) {
        return this.selectFrom().selectAll();
      }

      const whereFn = WhereClauseBuilder.exec(actualCriteria);
      return this.selectFrom().selectAll().where(whereFn);
    }

    static updateWhere(columns: UpdateObjectExpression<DB, TB, TB>, criteria?: Plugin.MixinAddons.Criteria<DB, TB>) {
      if (!criteria) {
        return this.updateTable().set(columns);
      }
      const whereFn = WhereClauseBuilder.exec(criteria);
      return this.updateTable().set(columns).where(whereFn);
    }

    static deleteWhere(criteria?: Plugin.MixinAddons.Criteria<DB, TB>) {
      if (!criteria) {
        return this.deleteFrom();
      }
      const whereFn = WhereClauseBuilder.exec(criteria);
      return this.deleteFrom().where(whereFn);
    }
  }

  return MixinClass as any;
}

export function createBaseModelAdapter<DB, TB extends keyof DB, TModel>(
  model: TModel,
): TModel & Plugin.MixinAddons.BaseModelInterface<DB, TB> {
  return model as TModel & Plugin.MixinAddons.BaseModelInterface<DB, TB>;
}
