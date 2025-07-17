import { ServerException } from '@/exceptions';
import { type ExpressionBuilder, type KyselyOperatorExpression, type ReferenceExpression } from 'kysely';
import AndOrExpressionBuilder from './andOr';
import ChainableFnExpressionBuilder from './chainableFn';

export default class CriteriaExpressionBuilder {
  private static eb?: ExpressionBuilder<any, any>;

  private static createChainableMethod(methodImpl: (...args: any[]) => any) {
    if (!this?.eb) throw new ServerException(500, 'Expression builder missing');
    const eb = this.eb;
    return (...args: any[]) => {
      const expression = methodImpl(...args);
      return AndOrExpressionBuilder.exec(expression, eb);
    };
  }

  static exec<DB, TB extends keyof DB>(eb: ExpressionBuilder<DB, TB>, column: ReferenceExpression<DB, TB>) {
    this.eb = eb;
    return {
      op: this.createChainableMethod((...args: any[]) => {
        if (args.length === 2) {
          const [operator, value] = args as [KyselyOperatorExpression, any];

          const rightOperand = value && typeof value === 'object' && value.__isChainableFn ? value.__expression : value;

          return eb(column, operator, rightOperand);
        } else {
          const [valueA, operator, valueB] = args as [any, KyselyOperatorExpression, any];
          const leftOperand =
            valueA && typeof valueA === 'object' && valueA.__isChainableFn ? valueA.__expression : valueA;

          const rightOperand =
            valueB && typeof valueB === 'object' && valueB.__isChainableFn ? valueB.__expression : valueB;

          return eb(leftOperand, operator, rightOperand);
        }
      }),
      between: this.createChainableMethod((start: any, end: any) => {
        return eb.between(column, start, end);
      }),
      betweenSymmetric: this.createChainableMethod((start: any, end: any) => {
        return eb.betweenSymmetric(column, start, end);
      }),

      fn: ChainableFnExpressionBuilder.exec(column, eb),
      where: eb,
    } as any;
  }
}
