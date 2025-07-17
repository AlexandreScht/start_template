import { type ExpressionBuilder } from 'kysely';

export default class AndOrExpressionBuilder {
  static exec<DB, TB extends keyof DB>(expression: any, eb: ExpressionBuilder<DB, TB>) {
    return {
      and: (exprOrArray: any | any[]) => {
        const right = Array.isArray(exprOrArray)
          ? eb.and(exprOrArray.map(e => this.unwrap(e)))
          : this.unwrap(exprOrArray);
        const combined = eb.and([expression, right]);
        return this.exec(combined, eb);
      },
      or: (exprOrArray: any | any[]) => {
        const right = Array.isArray(exprOrArray)
          ? eb.or(exprOrArray.map(e => this.unwrap(e)))
          : this.unwrap(exprOrArray);
        const combined = eb.or([expression, right]);
        return this.exec(combined, eb);
      },
      __isAndOrExpression: true,
      __expression: expression,
    };
  }

  private static unwrap(expr: any) {
    return expr && typeof expr === 'object' && expr.__isAndOrExpression ? expr.__expression : expr;
  }
}
