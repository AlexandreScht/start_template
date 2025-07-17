import { type Plugin } from '@/interfaces/plugins';
import { type ExpressionBuilder } from 'kysely';
import CriteriaExpressionBuilder from './criteria';

export default class WhereClauseBuilder {
  static exec<DB, TB extends keyof DB>(criteria: Plugin.MixinAddons.Criteria<DB, TB>) {
    return (eb: ExpressionBuilder<DB, TB>) => {
      const entries = Object.entries(criteria);
      if (entries.length === 0) return eb.and([]);
      const conditions = entries.map(([col, val]) => {
        if (typeof val === 'function') {
          const builder = CriteriaExpressionBuilder.exec(eb, col as any);
          const res = val(builder);
          return res.__isAndOrExpression ? res.__expression : res;
        }
        if (Array.isArray(val)) {
          const [op, v] = val;
          return eb(col as any, op, v);
        }
        return eb(col as any, '=', val);
      });
      return eb.and(conditions);
    };
  }
}
