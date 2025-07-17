import { type Plugin } from '@/interfaces/plugins';
import { type ConversionType, type DateUnit } from '@/mixins/chainableFn';
import type {
  Expression,
  ExpressionBuilder,
  ExpressionWrapper,
  ReferenceExpression,
  SelectCallback,
  SelectExpression,
  SelectQueryBuilder,
  ValueExpression,
} from 'kysely';
import { type DynamicReferenceBuilder } from 'kysely/dist/cjs/dynamic/dynamic-reference-builder';
import { type ReturningCallbackRow, type ReturningRow } from 'kysely/dist/cjs/parser/returning-parser';
import { type SelectQueryBuilderExpression } from 'kysely/dist/cjs/query-builder/select-query-builder-expression';
import type { __aggregateType } from './symbols';

declare module 'kysely' {
  type PostgresDateFormat =
    // --- Formats de Date Standards & Techniques ---
    | 'YYYY-MM-DD' // ISO 8601 Date (le plus recommandé)
    | 'YYYY/MM/DD'
    | 'YYYY.MM.DD'
    | 'YYYYMMDD' // ISO 8601 Date (sans séparateurs)
    | 'YY-MM-DD' // Année sur 2 chiffres
    | 'MM-DD-YYYY' // Format US
    | 'MM/DD/YYYY'
    | 'MM.DD.YYYY'
    | 'DD-MM-YYYY' // Format européen
    | 'DD/MM/YYYY'
    | 'DD.MM.YYYY'

    // --- Formats de Timestamp (Date + Heure) ---
    | 'YYYY-MM-DD HH24:MI:SS' // Timestamp 24h
    | 'YYYY-MM-DD HH24:MI' // Timestamp 24h sans secondes
    | 'YYYY-MM-DD HH12:MI:SS AM' // Timestamp 12h
    | 'YYYY-MM-DD HH12:MI AM' // Timestamp 12h sans secondes
    | 'DD/MM/YYYY HH24:MI:SS'
    | 'YYYY-MM-DD"T"HH24:MI:SS' // ISO 8601 avec "T"
    | 'YYYY-MM-DDTHH24:MI:SSZ' // ISO 8601 UTC (suffixe Z)
    | 'YYYY-MM-DDTHH24:MI:SS+TZH:TZM' // ISO avec décalage UTC
    | 'YYYY-MM-DDTHH24:MI:SS.MS'
    | 'YYYY-MM-DDTHH24:MI:SS.US'
    | 'YYYY-MM-DDTHH24:MI:SS.MS+TZH:TZM'
    | 'YYYY-MM-DDTHH24:MI:SS.US+TZH:TZM'
    | 'YYYY-MM-DD HH24:MI:SS.MS' // Millisecondes
    | 'YYYY-MM-DD HH24:MI:SS.US' // Microsecondes
    | 'YYYY-MM-DD HH24:MI:SS TZ' // Fuseau horaire (ex: UTC)
    | 'YYYY-MM-DD HH24:MI:SS OF' // Décalage UTC (ex: +02:00)
    | 'YYYY-MM-DD"T"HH24:MI:SS.USZ' // ISO 8601 complet avec microsec et Z

    // --- Formats Verbeux et Localisés ---
    | 'DD Mon YYYY' // Ex: 04 Jul 2024
    | 'DD Month YYYY' // Ex: 04 July 2024
    | 'Mon DD, YYYY' // Ex: Jul 04, 2024
    | 'Month DD, YYYY' // Ex: July 04, 2024
    | 'Day, Month DD, YYYY' // Ex: Thursday, July 04, 2024
    | 'TMMonth DD, YYYY' // Localisé : juillet 04, 2024
    | 'TMDay, DD TMMonth YYYY' // Localisé complet
    | 'FMDD TMMonth YYYY' // Sans zéro : 4 Juillet 2024
    | 'DDth "of" TMMonth, YYYY' // Avec suffixe ordinal : 04th of July, 2024

    // --- Formats d’Heure uniquement ---
    | 'HH24:MI:SS'
    | 'HH12:MI:SS AM'
    | 'HH24:MI'
    | 'HH12:MI AM'

    // --- Formats Spécialisés / Par Composants ---
    | 'YYYY-DDD' // Jour de l'année (001-366)
    | 'YYYY-WW' // Semaine de l'année (commence au 1er janv)
    | 'IYYY-IW' // Semaine ISO 8601
    | 'YYYY / Q' // Trimestre
    | 'J'; // Jour julien absolu (ex: 2451545)
  export type KyselyOperatorExpression =
    | '='
    | '!='
    | '<>'
    | '>'
    | '>='
    | '<'
    | '<='
    | 'in'
    | 'not in'
    | 'is'
    | 'is not'
    | 'is distinct from'
    | 'is not distinct from'
    | 'like'
    | 'not like'
    | 'ilike'
    | 'not ilike'
    | 'regexp'
    | '~'
    | '~*'
    | '!~'
    | '!~*'
    | '@>'
    | '<@'
    | '&&'
    | '?'
    | '?&'
    | '?|'
    | 'match'
    | '@@'
    | '@@@'
    | '<->'
    | '^@';
  export type SqlFunctionName =
    // Fonctions de chaînes
    | 'upper'
    | 'lower'
    | 'initcap'
    | 'concat'
    | 'substring'
    | 'left'
    | 'right'
    | 'trim'
    | 'ltrim'
    | 'rtrim'
    | 'replace'
    | 'reverse'
    | 'repeat'
    // Informations sur les chaînes
    | 'length'
    | 'position'
    // Fonctions numériques
    | 'abs'
    | 'round'
    | 'floor'
    | 'ceil'
    | 'ceiling'
    | 'trunc'
    | 'mod'
    | 'power'
    | 'sqrt'
    | 'sign'
    // Trigonométrie
    | 'sin'
    | 'cos'
    | 'tan'
    | 'asin'
    | 'acos'
    | 'atan'
    // Agrégats
    | 'count'
    | 'sum'
    | 'avg'
    | 'min'
    | 'max'
    | 'array_agg'
    | 'json_agg'
    | 'jsonb_agg'
    | 'string_agg'
    | 'group_concat'
    | 'listagg'
    // Date/heure
    | 'now'
    | 'current_timestamp'
    | 'current_date'
    | 'current_time'
    | 'date_part'
    | 'year'
    | 'month'
    | 'day'
    | 'to_char'
    | 'date_format'
    | 'strftime'
    | 'date_add'
    | 'date_sub'
    | 'datediff'
    | 'age'
    // Conditionnelles
    | 'coalesce'
    | 'nullif'
    | 'greatest'
    | 'least'
    | 'isnull'
    | 'ifnull'
    // Conversion
    | 'cast'
    | 'convert'
    | 'to_number'
    | 'to_date'
    // JSON (PostgreSQL)
    | 'json_extract'
    | 'json_set'
    | 'json_remove'
    | 'json_array_length'
    | 'json_object_keys'
    | 'json_typeof'
    // Fenêtrage (window)
    | 'row_number'
    | 'rank'
    | 'dense_rank'
    | 'ntile'
    | 'lag'
    | 'lead'
    | 'first_value'
    | 'last_value';

  type IsJSONColumn<T> = [Extract<T, object>] extends [never] ? false : T extends Date ? false : true;

  type OperandExpressionFactory<DB, TB extends keyof DB, R> = (
    eb: ExpressionBuilder<DB, TB>,
  ) => ExpressionWrapper<DB, TB, R>;

  interface FunctionModule<DB, TB extends keyof DB> {
    /**
     * Applies a SQL function (aggregate, window, scalar, etc.) to a column, expression, or subquery
     *
     * @param sqlFn the SQL Function name
     * @param column the column to apply the function to
     * @property SQL Function
     *
     *
     * ### Example
     * ```ts
     * ::: (property: count)
     * //*→ WHERE COUNT(id) AS total_id
     * criteria({
     *   column_name: ({ fn }) => fn.count("id").as("total_id")
     * })
     *
     * ::: (sqlFn: string, column: string)
     * //*→ WHERE GREATEST(id)
     * criteria({
     *   column_name: ({ fn }) => fn("greatest", ["id"])
     * })
     *
     * ::: (property: avg, sqlFn: SQLFunction, column: N/A)
     * //*→ WHERE AVG(profile.stats.rating)
     * criteria({
     *   column_name: ({ fn }) =>
     *     fn.avg(({ jsonPath }) =>
     *       jsonPath("profile")
     *         .key('stats')
     *         .key('rating')
     *     )
     * })
     * ```
     */
    <O, RE extends ReferenceExpression<DB, TB> = ReferenceExpression<DB, TB>>(
      name: SqlFunctionName,
      args?: ReadonlyArray<RE>,
    ): ExpressionWrapper<DB, TB, O>;
  }

  type FilterOutGenericObject<T> = T extends any
    ? T extends Record<PropertyKey, any>
      ? keyof T extends never
        ? never
        : Record<PropertyKey, any> extends T
          ? never
          : T
      : T
    : never;

  type IsNever<T> = [T] extends [never] ? true : false;

  type ExtractTypeWithFallback<T> =
    IsNever<FilterOutGenericObject<T>> extends true ? Record<string, unknown> : FilterOutGenericObject<T>;

  type jsonType<T> = ExtractTypeWithFallback<Exclude<T, null>>;

  type KeysByType<T, Target> = {
    [K in keyof T]: NonNullable<T[K]> extends Target ? K : IsJSONColumn<NonNullable<T[K]>> extends true ? K : never;
  }[keyof T];

  type IsJSON<T> = NonNullable<T> extends object ? (NonNullable<T> extends Date ? false : true) : false;

  type NonJSONColumns<T> = {
    [K in keyof T]: IsJSON<T[K]> extends false ? K : never;
  }[keyof T];

  type JSONColumns<T> = {
    [K in keyof T]: IsJSON<T[K]> extends true ? K : never;
  }[keyof T];

  type JSONColumnObject<T> = {
    [K in JSONColumns<T>]?: (path: jsonType<T[K]>) => string | number;
  };
  type ColumnOrFunction<T> = NonJSONColumns<T> | JSONColumnObject<T>;

  type DoubleArg<T, V, K extends keyof T = KeysByType<T, V>> =
    | (K extends any ? (IsJSON<T[K]> extends false ? K : never) : never)
    | (K extends any ? (IsJSON<T[K]> extends true ? [K, (v: jsonType<T[K]>) => V] : never) : never);

  type PathReturn<T> = T extends (arg: any) => infer R ? R : never;

  type ExcludeOption = 'current row' | 'group' | 'ties';
  type BoundaryKind = 'preceding' | 'following' | 'unbounded preceding' | 'unbounded following' | 'current row';
  type BoundaryTuple<K extends BoundaryKind = BoundaryKind> = K extends 'preceding' | 'following' ? [K, number] : [K];

  interface BetweenOrder {
    between: BoundaryTuple;
    and: BoundaryTuple;
  }

  interface sqlMethod<T> {
    /** #### 🔹 Generate a raw SQL expression  */
    toSQL(sql: string): FinalizedSQL<T>;
  }

  type FinalizedSQL<T> = {
    [__aggregateType]?: T;
  };

  interface OverStart<T, TModel, K extends keyof TModel> extends sqlMethod<T> {
    /** #### 🔹 Defines how to split the dataset into partitions before applying the window function.
     *
     * 🔸Partition rows by department, so each department is treated independently
     *  @param columns – Specify one or more column names
     * * **Effect:** Groups rows into separate partitions based on the values of the specified columns.
     * * **Usage:** Use when you want to compute aggregates or rankings within each group.
     * @example
     * partitionBy(['departmentId'])
     * partitionBy(['departmentId', { profile: v => v.infos.salary }])
     */
    partitionBy(columns: ColumnOrFunction<TModel>[]): Omit<OverStart<T, TModel, K>, 'partitionBy'>;

    /** #### 🔹 Defines the ordering of rows within each partition for the window function.
     *🔸Order rows by hireDate ascending before computing a moving average
     *  @param columns – Specify one or more column names
     * * **Effect:** Specifies the sort key(s) that determine row order inside each partition; affects frame boundaries and ranking.
     * * **Usage:** Use when your window calculation depends on the position or rank of rows.
     * @example
     * orderBy(['hireDate'])
     * partitionBy(['hireDate', { profile: v => v.infos.salary }])
     */
    orderBy(columns: ColumnOrFunction<TModel>[]): OverAfterOrder<T>;
  }

  interface OverAfterOrder<T> extends sqlMethod<T> {
    /** #### 🔹 Defines a **ROWS-based** window frame using explicit start/end offsets.
     *
     * 🔸@param `between` & `and`
     * * **Effect:** Frames are calculated by physical row positions.
     * * **Usage:** When you want to include a fixed number of rows before/after.
     *  ```ts
     *   ["preceding", N] // Start N rows before the current row.
     *   ["following", N] // End N rows after the current row.
     *   ["preceding unbounded"] // Start at the very first row in the partition.
     *   ["following unbounded"] // End at the very last row in the partition.
     *   ["current row"] // Anchor exactly at the current row.
     *  ```
     * @exemple
     *   ```ts
     *   rows({ between: ['preceding', 5], and: ['current row'] })
     *   ```
     */
    rows(arg: BetweenOrder): OverAfterBetween<T>;
    /** #### 🔹 Defines a **RANGE-based** window frame using explicit start/end value ranges.
     *
     * 🔸@param `between` & `and`
     * * **Effect:** Frames are calculated by logical ranges of the ORDER BY values.
     * * **Usage:** When you need to span a numeric interval before/after the current value.
     *  ```ts
     *   ["preceding", N] // Include rows with ORDER BY values N units less than the current.
     *   ["following", N] // Include rows with ORDER BY values N units greater than the current.
     *   ["preceding unbounded"] // Include from the lowest ORDER BY value up to current.
     *   ["following unbounded"] // Include from current up to the highest ORDER BY value.
     *   ["current row"] // Anchor the range exactly at the current value.
     *  ```
     * @exemple
     *   ```ts
     *   range({ between: ['preceding', 10], and: ['current row']})
     *   ```
     */
    range(arg: BetweenOrder): OverAfterBetween<T>;

    /** #### 🔹 Defines a **GROUPS-based** window frame using peer-group offsets.
     *
     * 🔸@param `between` & `and`
     * * **Effect:** Frames are determined by entire peer groups sharing the same ORDER BY value.
     * * **Usage:** When you want to move by groups (ties) rather than individual rows.
     *  ```ts
     *   ["preceding", N] // Include N peer-groups before the current group.
     *   ["following", N] // Include N peer-groups after the current group.
     *   ["preceding unbounded"] // Include from the first peer-group up to current.
     *   ["following unbounded"] // Include from current peer-group to the last.
     *   ["current row"] // Anchor exactly at the current peer-group.
     *  ```
     * @exemple
     *   ```ts
     *   groups({ between: ['preceding', 2], and: ['current row'] })
     *   ```
     */
    groups(arg: BetweenOrder): OverAfterBetween<T>;
  }

  interface OverAfterBetween<T> extends sqlMethod<T> {
    /** #### 🔹 Applies a filter to the current window frame by excluding rows based on the given option.
     *
     * 🔸@param `current row`
     * * **Effect:** Omit only the current row from the frame.
     * * **Usage:** Use when you need metrics over “all other” rows in the group.
     *    ```ts
     *    exclude('current row')
     *    ```
     *
     * 🔸@param`exclude ties`
     * * **Effect:** Omit any rows that tie with the current row on the ORDER BY key, but keep the current row itself.
     * * **Usage:** Use for nuanced ranking analyses where tied peers should be excluded.
     *     ```ts
     *     exclude('exclude ties')
     *     ```
     *
     * 🔸@param`exclude group`
     * * **Effect:** Omit the entire group of tied rows, including the current row.
     * * **Usage:** Use when comparing a row against entirely different groups.
     *     ```ts
     *     exclude('exclude group')
     *     ```
     */
    exclude(option: ExcludeOption): sqlMethod<T>;
  }

  type AggregateChain<RawType, TModel> = {
    over: () => OverStart<RawType, TModel, keyof TModel>;
    [__aggregateType]?: RawType;
  };

  export interface AggregateMethodsHelper<T> {
    /** #### 🔹Computes the average of a numeric column.
     * @param column column name
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example avg('price') // [10, 20, 30] => 20
     * avg('profile', v => v.price) // [10, 20, 30] => 20
     */
    avg: <V extends number, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<number, T>;

    /** #### 🔹Computes the sum of a numeric column.
     * @param column column name.
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example sum('price') // [10, 20, 30] => 60
     * sum('profile', v => v.price) // [10, 20, 30] => 60
     */
    sum: <V extends number, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<number, T>;

    /** #### 🔹Counts the number of rows. Use `*` for count any column.
     * @params column name | "*"
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example count('id') // [1, 2, 3] => 3
     * count('*') // [1, 2, 3] => 3
     */
    count: <K extends keyof T>(col?: K | '*') => AggregateChain<number, T>;

    /** #### 🔹Counts the `distinct` number of rows. Use `*` for count any column.
     * @params column name | "*"
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example countDistinct('id') // [1, 2, 3] => 3
     * countDistinct('*') // [1, 2, 3] => 3
     */
    countDistinct: <K extends keyof T>(col?: K | '*') => AggregateChain<number, T>;

    /** #### 🔹Finds the minimum value in a column. Works on numbers, strings, and dates.
     * @param column column name.
     * @param path for `JSON` column
     * @method ``over`` applies aggregation across rows as a window function. type only.
     * @return The type of the matching column.
     * @example min('price') // [10, 20, 5] => 5
     * min('name') // ["C", "A", "B"] => "A" (the lower in asc order)
     * min('created_at') // [01/01/1900, 01/01/2000] => 01/01/1900 (the oldest)
     * min('profile', v => v.price) // [10, 20, 5] => 5
     */
    min: <V extends string | number | Date, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<T[K], T>;

    /** #### 🔹Finds the maximum value in a column. Works on numbers, strings, and dates.
     * @param column column name.
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return The type of the matching column.
     * @example max('price') // [10, 20, 5] => 20
     * max('name') // ["C", "A", "B"] => "C" (the bigger in asc order)
     * max('created_at') // [01/01/1900, 01/01/2000] => 01/01/2000 (the newest)
     * max('profile', v => v.price) // [10, 20, 5] => 5
     */
    max: <V extends string | number | Date, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<T[K], T>;

    /** #### 🔹Difference of each value from the average number.
     * @param column column name
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example stddev_samp('price') // [10, 20, 30] => 10
     * stddev_samp('profile', v => v.price) // [10, 20, 30] => 10
     */
    stddev_samp: <V extends number, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<number, T>;

    /** #### 🔹Difference of each value from the average number across the entire dataset
     * @param column column name
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example stddev_pop('price') // [10, 20, 30] => 8.16
     * stddev_pop('profile', v => v.price) // [10, 20, 30] => 8.16
     */
    stddev_pop: <V extends number, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<number, T>;

    /** #### 🔹Difference squared of each value from the average number
     * @param column column name
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example variance('price') // [10, 20, 30] => 100
     * variance('profile', v => v.price) // [10, 20, 30] => 100
     */
    var_samp: <V extends number, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<number, T>;

    /** #### 🔹Difference squared of each value from the average number across the entire dataset
     * @param column column name
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example var_pop('price') // [10, 20, 30] => 66.67
     * var_pop('profile', v => v.price) // [10, 20, 30] => 66.67
     */
    var_pop: <V extends number, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<number, T>;

    /** #### 🔹Calculates the correlation coefficient between two numeric columns.
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example corr('price', 'id') // [10, 1] & [20, 2] => 1
     * corr(["profile", v => v.price], ["profile", v => v.id]) // [10, 1] & [20, 2] => 1
     */
    corr: <V extends number, K1 extends KeysByType<T, V>, K2 extends KeysByType<T, V>>(
      colY: DoubleArg<T, V, K1>,
      colX: DoubleArg<T, V, K2>,
    ) => AggregateChain<number, T>;
    // corr: <K1 extends KeysByType<T, number>>(colY: K1, colX: K1) => number;

    /** #### 🔹Calculates covariance of two numeric columns for the entire dataset.
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example covar_pop('price', 'id') // [10, 1] & [20, 2] => 2.5
     * covar_pop(["profile", v => v.price], ["profile", v => v.id]) // [10, 1] & [20, 2] => 2.5
     */
    covar_pop: <V extends number, K1 extends KeysByType<T, V>, K2 extends KeysByType<T, V>>(
      colY: DoubleArg<T, V, K1>,
      colX: DoubleArg<T, V, K2>,
    ) => AggregateChain<number, T>;

    /** #### 🔹Calculates covariance of two numeric columns for a sample dataset.
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example covar_samp('price', 'id') // [10, 1] & [10, 2] => 5
     * covar_samp(["profile", v => v.price], ["profile", v => v.id]) // [10, 1] & [10, 2] => 5
     */
    covar_samp: <V extends number, K1 extends KeysByType<T, V>, K2 extends KeysByType<T, V>>(
      colY: DoubleArg<T, V, K1>,
      colX: DoubleArg<T, V, K2>,
    ) => AggregateChain<number, T>;

    /** #### 🔹Calculate the average of the `Dependent` column where both are `NOT NULL`.
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @param Dependent  - column to average (dependent values)
     * @param Independent - column used to filter rows (must also be `NOT NULL`)
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example
     * regr_avg('price', 'id') // [1, 2], [null, 5], [2, null], [2, 5] => avg of [1, 2] => 1.5
     * regr_avg(["profile", v => v.price], ["profile", v => v.id]) // [1, 2], [null, 5], [2, null], [2, 5] => avg of [1, 2] => 1.5
     */

    regr_avg: <V extends number, K1 extends KeysByType<T, V>, K2 extends KeysByType<T, V>>(
      colY: DoubleArg<T, V, K1>,
      colX: DoubleArg<T, V, K2>,
    ) => AggregateChain<number, T>;

    /** #### 🔹Counts the number of valid pairs where both columns have non-null values.
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example
     * regr_count('price', 'id') // [10,1], [20,2], [null,3] => 2
     * regr_count(["profile", v => v.price], ["profile", v => v.id]) // [10,1], [20,2], [null,3] => 2
     */
    regr_count: <V, K1 extends KeysByType<T, V>, K2 extends KeysByType<T, V>>(
      colY: DoubleArg<T, V, K1>,
      colX: DoubleArg<T, V, K2>,
    ) => AggregateChain<number, T>;

    /** #### 🔹 Calculates the y-intercept of the linear regression line for colA on colB.
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example
     * regr_intercept('price', 'id') // [[10,1], [20,2]] => 0
     * regr_intercept(["profile", v => v.price], ["profile", v => v.id]) // [[10,1], [20,2]] => 0
     */
    regr_intercept: <V extends number, K1 extends KeysByType<T, V>, K2 extends KeysByType<T, V>>(
      colY: DoubleArg<T, V, K1>,
      colX: DoubleArg<T, V, K2>,
    ) => AggregateChain<number, T>;

    /** #### 🔹Measures how closely `colA` and `colB` align on a linear trend (R²).
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`number`
     * @example
     * regr_r2('price', 'id') // [10, 1] & [20, 2] => 1
     * regr_r2(["profile", v => v.price], ["profile", v => v.id]) // [10, 1] & [20, 2] => 1
     */
    regr_r2: <V extends number, K1 extends KeysByType<T, V>, K2 extends KeysByType<T, V>>(
      colY: DoubleArg<T, V, K1>,
      colX: DoubleArg<T, V, K2>,
    ) => AggregateChain<number, T>;

    /** #### 🔹Returns the slope of the regression line predicting `Dependent` from `Independent`
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @param Dependent  - column (values to be predicted)
     * @param Independent - column (used to predict `Dependent`)
     * @method ``over`` applies aggregation across rows as a window function.
     * @returns`number`
     * @example
     * regr_slope('price', 'id') // [[10,1], [20,2]] => 10
     * regr_slope(["profile", v => v.price], ["profile", v => v.id]) // [[10,1], [20,2]] => 10
     */
    regr_slope: <V extends number, K1 extends KeysByType<T, V>, K2 extends KeysByType<T, V>>(
      colY: DoubleArg<T, V, K1>,
      colX: DoubleArg<T, V, K2>,
    ) => AggregateChain<number, T>;

    /** #### 🔹Calculate the sum of squared deviations of the Dependent column where both are `NOT NULL`.
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @param Dependent - column to compute squared deviations from the mean (dependent variable)
     * @param Independent - column used to filter rows (must also be non-null)
     * @method ``over`` applies aggregation across rows as a window function.
     * @returns`number`
     * @example
     * regr_sx('price', 'id') // [[10,1], [20,2]], [null, 10], [70, null] => 50
     * regr_sx(["profile", v => v.price], ["profile", v => v.id]) // [[10,1], [20,2]], [null, 10], [70, null] => 50
     */

    regr_sx: <V extends number, K1 extends KeysByType<T, V>, K2 extends KeysByType<T, V>>(
      colY: DoubleArg<T, V, K1>,
      colX: DoubleArg<T, V, K2>,
    ) => AggregateChain<number, T>;

    /** #### 🔹Calculates the sum of products of deviations of both columns from their average value.
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @method ``over`` applies aggregation across rows as a window function.
     * @returns`number`
     * @example
     * regr_sxy('price', 'id') // data: [[10,1], [20,2]] => 5
     * regr_sxy(["profile", v => v.price], ["profile", v => v.id]) // data: [[10,1], [20,2]] => 5
     */

    regr_prod: <V extends number, K1 extends KeysByType<T, V>, K2 extends KeysByType<T, V>>(
      colY: DoubleArg<T, V, K1>,
      colX: DoubleArg<T, V, K2>,
    ) => AggregateChain<number, T>;

    /** #### 🔹Concatenates string values from a column using a specified separator.
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @param column column name (column to aggregate)
     * @param separator - Separator between values
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`string`
     * @example
     * string_agg('name', '; ') // ["A", "B"] => "A; B"
     * string_agg(["profile", v => v.name], '; ') // ["A", "B"] => "A; B"
     */
    string_agg: <V extends string, K1 extends KeysByType<T, V>>(
      column: DoubleArg<T, V, K1>,
      separator: string,
    ) => AggregateChain<string, T>;

    /** #### 🔹Aggregates values from a column into an array with all column values.
     * @param column column name.
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return `matching column type[]`
     * @example
     * array_agg('price') // [10, 20] => [10, 20]
     * array_agg('profile', v => v.price) // [10, 20] => [10, 20]
     */
    array_agg: <V, K extends KeysByType<T, V>, P extends (v: jsonType<T[K]>) => any = (v: jsonType<T[K]>) => any>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [path: P] : []
    ) => IsJSON<T[K]> extends true ? AggregateChain<PathReturn<P>[], T> : AggregateChain<NonNullable<Array<T[K]>>, T>;

    /** #### 🔹Aggregates all column values into a JSON array string (conversion).
     * @param column column name.
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`string`
     * @example
     * json_agg('name') // ["A", "B"] => '[\"A\", \"B\"]'
     * json_agg('profile', v => v.price) // [10, 15] => '[10, 15]'
     */
    json_agg: <V, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<string, T>;

    /** #### 🔹Aggregates key/value pairs from two columns into a JSON object string (conversion).
     * @paramType number column name type `|` [ JSON column name type, v => v.path ]
     * @param keyCol - Column used as JSON keys (must be string)
     * @param valueCol - Column used as JSON values
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`string`
     * @example
     * json_object_agg('name', 'price') // ["A", 10] & ["B", 20] => "{\"A\":10,\"B\":20}"
     * json_object_agg(["profile", v => v.name], ["profile", v => v.price]) // ["A", 10] & ["B", 20] => "{\"A\":10,\"B\":20}"
     */

    json_object_agg: <V1 extends string, V2, K1 extends KeysByType<T, V1>, K2 extends KeysByType<T, V2>>(
      colY: DoubleArg<T, V1, K1>,
      colX: DoubleArg<T, V2, K2>,
    ) => AggregateChain<Record<string, T[K2]>, T>;

    /** #### 🔹Alias for bool_and: returns TRUE if all values are TRUE.
     * @param column column name.
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`boolean`
     * @example
     * every('in_stock') // [true, true, false] => false
     * every('profile', v => v.in_stock) // [true, true, false] => false
     */
    every: <V extends boolean, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<boolean, T>;

    /** #### 🔹Returns TRUE if at least one input value in the boolean column is TRUE.
     * @param column column name.
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return`boolean`
     * @example
     * bool_or('in_stock') // [true, false, false] => true
     * bool_or('profile', v => v.in_stock) // [true, false, false] => false
     */
    bool_or: <V extends boolean, K extends KeysByType<T, V>>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<boolean, T>;

    /** #### 🔹Returns the most frequent value in the column.
     * @param column column name.
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return `matching column type`
     * @example
     * mode('name') // ["A", "B", "B"] => "B"
     * mode('profile', v => v.name) // ["A", "B", "B"] => "B"
     */
    mode: <V, K extends KeysByType<T, V>, P extends (v: jsonType<T[K]>) => any = (v: jsonType<T[K]>) => any>(
      column: K,
      ...args: IsJSON<T[K]> extends true ? [path: P] : []
    ) => IsJSON<T[K]> extends true ? AggregateChain<PathReturn<P>, T> : AggregateChain<NonNullable<T[K]>, T>;

    /** #### 🔹Calculates the continuous percentile for a numeric or date column.
     * 🔸0.5 corresponds to retrieving the middle value in an array of 3 values, which is the element at index 1 in the sorted array. If the percentile do not corresponds to a index value in the array, it will calculate the value between the two closest indexes)
     * @param fraction - Percentile fraction `between 0 and 1`
     * @param column - Numeric or Date column type
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return `number`
     * @example
     * percentile_cont(0.5, 'price') // [10, 20, 100] => 20
     * percentile_cont(0.75, 'price') // [10, 20, 100] => 60
     * percentile_cont(0.75, 'profile', v => v.price) // [10, 20, 100] => 60
     */
    percentile_cont: <V extends number | Date, K extends KeysByType<T, V>>(
      fraction: number | number[],
      column: K,
      ...args: IsJSON<T[K]> extends true ? [(v: jsonType<T[K]>) => V] : []
    ) => AggregateChain<number, T>;

    /** #### 🔹Finds the first value at or just above the specified percentile fraction within the ordered values.
     * @param fraction - Percentile fraction `between 0 and 1`
     * @param column column name.
     * @param path for `JSON` column type only.
     * @method ``over`` applies aggregation across rows as a window function.
     * @return `matching column type`
     * @example
     * percentile_disc(0.5, 'name') // ["A", "B", "C"] => "B"
     * percentile_disc(0.6, 'name') // ["A", "B", "C"] => "B"
     * percentile_disc(0.6, 'profile', v => v.name) // ["A", "B", "C"] => "B"
     */
    percentile_disc: <
      V extends number | Date | string | boolean,
      K extends KeysByType<T, V>,
      P extends (v: jsonType<T[K]>) => V = (v: jsonType<T[K]>) => V,
    >(
      fraction: number | number[],
      column: K,
      ...args: IsJSON<T[K]> extends true ? [path: P] : []
    ) => IsJSON<T[K]> extends true ? AggregateChain<PathReturn<P>, T> : AggregateChain<NonNullable<T[K]>, T>;
  }

  interface JsonFnMethods<DB, TB extends keyof DB, T> {
    /** #### 🔹Get JSON value.
     * @example fn.json_get(col => col.loc.address.city) // => { loc : { address: { city: 'Paris' } } }
     * fn.json_get(v => v.skills[0]) // => get the fist skill from the skills array
     */
    json_get<V>(path: (v: jsonType<T>) => void): CustomFunctionModule<DB, TB, V>;

    /** #### 🔹Returns JSON array length.
     * @example fn.json_array_length() // 2
     */
    json_array_length<V extends readonly any[]>(path: (v: jsonType<T>) => V): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns JSON value type.
     * @example fn.json_typeof() // string
     */
    json_typeof(path: (v: jsonType<T>) => void): CustomFunctionModule<DB, TB, string>;
  }

  interface BaseFunctionModule<DB, TB extends keyof DB, T>
    extends Omit<ExpressionWrapper<DB, TB, T>, 'and' | 'or' | '$castTo' | '$notNull' | '$asScalar'> {
    /** #### 🔹Converts a string to uppercase.
     * @example fn.upper() // "upper" => "UPPER"
     */
    upper(): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Converts a string to lowercase.
     * @example fn.lower() // "lower" => "lower"
     */
    lower(): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Converts the first character of each word to uppercase.
     * @example fn.initcap() // "the first character" => "The First Character"
     */
    initcap(): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Concatenates two or more strings.
     * @example fn.concat(col => ['suffix', col, 'prefix']) // "suffix ${col_value} prefix"
     * fn.concat(() => ['suffix', 'prefix']) // "suffix prefix"
     */
    concat(callback: (column: string) => string[]): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Extracts a substring from a string. Start at index 1
     * @example fn.substring(3, 9) // "Hello World" => "lo Wor"
     */
    substring(start: number, length?: number): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Returns the leftmost characters from a string. Start at index 1
     * @example fn.left(5) // "Hello World" => "Hello"
     */
    left(length: number): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Returns the rightmost characters from a string. Start at index 1
     * @example fn.right(5) // "Hello World" => "World"
     */
    right(length: number): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Removes leading and trailing whitespace.
     * @example fn.trim() // " Hello World " => "Hello World"
     */
    trim(): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Removes leading whitespace.
     * @example fn.ltrim() // " Hello World " => "Hello World "
     */
    ltrim(): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Removes trailing whitespace.
     * @example fn.rtrim() // " Hello World " => " Hello World"
     */
    rtrim(): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Replaces occurrences of a substring.
     * @example fn.replace('World', 'Everyone') // "Hello World" => "Hello Everyone"
     */
    replace(oldValue: string, newValue: string): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Reverses a string.
     * @example fn.reverse()  // "Hello World" => "dlroW olleH"
     */
    reverse(): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Repeats a string a specified number of times.
     * @example fn.repeat(3) // "Hello World" => "Hello WorldHello WorldHello World"
     */
    repeat(count: number): CustomFunctionModule<DB, TB, string>;

    // === Informations sur les chaînes ===

    /** #### 🔹Returns the length of a string. Start at index 1
     * @example fn.length() // "Hello World" => 11
     */
    length(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the position of a chart string. Start at index 1
     * @example fn.position('World') // "Hello World" => 7
     */
    position(searchString: string): CustomFunctionModule<DB, TB, number>;

    // === Fonctions numériques ===

    /** #### 🔹Returns the absolute value.
     * @example fn.abs() // -42.567 => 42.567
     */
    abs(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Rounds a number to specified decimal places.
     * @example fn.round(2) // 42.567 => 42.57
     */
    round(precision?: number): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the largest integer less than or equal to the number.
     * @example fn.floor() // 42.567 => 42
     */
    floor(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the smallest integer greater than or equal to the number.
     * @example fn.ceil() // 42.567 => 43
     */
    ceil(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Truncates a number to specified decimal places.
     * @example fn.trunc(2) // 42.567 => 42.56
     */
    trunc(precision?: number): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the remainder of division.
     * @example fn.mod(10) // 42 => 2
     */
    mod(divisor: number): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Raises a number to a power.
     * @example fn.power(2) // 4 => 16
     */
    power(exponent: number): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the square root.
     * @example fn.sqrt() // 49 => 7
     */
    sqrt(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the sign of a number.
     * @return `-1` | `0` | `1`
     * @example fn.sign() // -42 => -1
     */
    sign(): CustomFunctionModule<DB, TB, number>;

    // === Fonctions trigonométriques ===

    /** #### 🔹Returns the sine.
     * @example fn.sin() // π/2 => 1
     */
    sin(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the cosine.
     * @example fn.cos() // π => -1
     */
    cos(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the tangent.
     * @example fn.tan() // 1 => 1.5574...
     */
    tan(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the arcsine.
     * @example fn.asin() // 1 => π/2
     */
    asin(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the arccosine.
     * @example fn.acos() // 1 => 0
     */
    acos(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the arctangent.
     * @example fn.atan() // 1 => π/4
     */
    atan(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Returns the current timestamp.
     * @example fn.current_timestamp() // 2025-07-08T14:32:00.000Z
     */
    current_timestamp(): CustomFunctionModule<DB, TB, Date>;

    /** #### 🔹Returns the current date.
     * @example fn.current_date() // 2025-07-08
     */
    current_date(): CustomFunctionModule<DB, TB, Date>;

    /** #### 🔹Returns the current time.
     * @example fn.current_time() // 14:32:00
     */
    current_time(): CustomFunctionModule<DB, TB, Date>;

    /** #### 🔹Extracts a part from a date.
     * @param `DateUnit` enum
     * @example fn.date_part(DateUnit.Month) // "2025-07-08" => 7
     */
    date_part(unit: DateUnit): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Extracts the year from a date.
     * @example fn.year() // "2025-07-08" => 2025
     */
    year(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Extracts the month from a date.
     * @example fn.month() // "2025-07-08" => 7
     */
    month(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Extracts the day from a date.
     * @example fn.day() // "2025-07-08" => 8
     */
    day(): CustomFunctionModule<DB, TB, number>;

    /** #### 🔹Formats a date as a string.
     * @example fn.date_format('YYYY-MM-DD') // "2025-07-08T14:32:00.000Z" => "2025-07-08"
     */
    date_format(format: PostgresDateFormat): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Adds an interval to a date. ( use enum DateUnit )
     * @param `DateUnit` enum
     * @example fn.date_add(1, DateUnit.Month) // "2025-07-08" => "2025-08-08"
     */
    date_add(interval: string | number, unit: DateUnit): CustomFunctionModule<DB, TB, Date>;

    /** #### 🔹Subtracts an interval from a date. ( use enum DateUnit )
     * @param `DateUnit` enum
     * @example fn.date_sub(1, DateUnit.Day) // "2025-07-08" => "2025-07-07"
     */
    date_sub(interval: string | number, unit: DateUnit): CustomFunctionModule<DB, TB, Date>;

    /** #### 🔹Calculates the age.
     * @param timeA compare to column `Date` value
     * @param timeB compare to `timeA` date value
     * @example fn.age(new Date()) // "2000-01-01" => "25 years 6 mons 7 days"
     * fn.age("2025-07-08 19:11:55", "2023-01-10 10:00:00") // "2 years 5 mons 28 days 09:11:55"
     */
    age<V extends Date | string>(compareDate?: ValueExpression<DB, TB, V>): CustomFunctionModule<DB, TB, string>;

    /** #### 🔹Returns the first non-null value.
     * @example fn.coalesce([() => "salary", 5000, ...]) // return salary column value, if null return 5000
     */
    coalesce<V>(
      value: (string | number | Date | (() => ReferenceExpression<DB, TB>))[],
    ): CustomFunctionModule<DB, TB, V>;

    /** #### 🔹Returns null if values are equal.
     * @example fn.nullif(5) // 5 => null
     */
    nullif<V>(value: ValueExpression<DB, TB, V>): CustomFunctionModule<DB, TB, V | null>;

    /** #### 🔹Returns the greatest value.
     * @example fn.greatest([() => "salary", 5000, ...]) // return biggest value between salary column value and 5000
     */
    greatest<V>(value: (number | Date | (() => ReferenceExpression<DB, TB>))[]): CustomFunctionModule<DB, TB, V>;

    /** #### 🔹Returns the smallest value.
     * @example fn.smallest([() => "user.salary", 1000, ...]) // return smallest value between salary column value and 1000
     */
    smallest<V>(value: (number | Date | (() => ReferenceExpression<DB, TB>))[]): CustomFunctionModule<DB, TB, V>;

    /** #### 🔹Converts to specified type.
     * @param `ConversionType` enum
     * @example fn.convert(ConversionType.Varchar)  // 123 => "123"
     */
    convert<V>(type: ConversionType): CustomFunctionModule<DB, TB, V>;

    /** #### 🔹Converts text to number.
     * @param format - Format mask following PostgreSQL formatting rules.
     * - `9`: digit placeholder
     * - `0`: leading/trailing zero placeholder
     * - `D`: locale-aware decimal separator
     * - `G`: locale-aware thousands separator
     * - `S`: locale-aware sign (+/-)
     * - `MI`: minus sign for negative values
     * - `PL`: plus sign for positive values
     * - `SG`: explicit plus/minus sign
     * - `PR`: negative value in angle brackets (e.g., <123>)
     * - `L`: locale-aware currency symbol
     * - `$`: dollar sign symbol
     * - `V`: implicit decimal point
     * - `FM`: fill mode, suppresses extra whitespace and zeros
     * @example fn.to_number('L9G999D99') // '€1,234.56' => 1234.56
     * fn.to_number() // '42.5' => 42.5
     */
    to_number(format?: string): CustomFunctionModule<DB, TB, number>;
  }

  type CustomFunctionModule<DB, TB extends keyof DB, T> = BaseFunctionModule<DB, TB, T> &
    (IsJSONColumn<T> extends true ? JsonFnMethods<DB, TB, T> : unknown);

  interface AndOrExpression<T = any> {
    /** #### 🔹Combine cette expression avec une autre en utilisant l'opérateur AND
     * @param expression - Expression à combiner ou array d'expressions
     */
    and<U>(expression: AndOrExpression<U>): AndOrExpression<T>;
    and<U>(expression: U): AndOrExpression<T>;
    and<U>(expressions: Array<AndOrExpression<U> | U>): AndOrExpression<T>;

    /** #### 🔹Combine cette expression avec une autre en utilisant l'opérateur OR
     * @param expression - Expression à combiner ou array d'expressions
     */
    or<U>(expression: AndOrExpression<U>): AndOrExpression<T>;
    or<U>(expression: U): AndOrExpression<T>;
    or<U>(expressions: Array<AndOrExpression<U> | U>): AndOrExpression<T>;
  }

  interface CriteriaExpressionBuilder<DB, TB extends keyof DB, T> {
    (operator: KyselyOperatorExpression, value: T): AndOrExpression;
    /** #### 🔹check two values with an operator
     *
     * @param expr the FunctionModule (or `undefined` to apply to the current column)
     * @param op the operator
     * @param value the second value to compare
     *
     * ### Example
     * ```ts
     * ::: (expr: N/A, op: KyselyOperatorExpression, value: $1)
     *  //*→ WHERE age = $1 ($1=1)
     *  criteria({
     *    age: ({ op }) => op("=", 18)
     *  })
     *
     * ::: (expr: FunctionModule, op: KyselyOperatorExpression, value: $1)
     *  //*→ WHERE profile.stats.stars BETWEEN $1 AND $2 ($1=1, $2=5)
     *  criteria({
     *    profile: ({ jsonPath, between }) => between(jsonPath().key('stats').key('stars'), 1, 5)
     *  })
     *
     *
     * ```
     */
    op(operator: KyselyOperatorExpression, valueB: BaseFunctionModule<DB, TB, T> | T): AndOrExpression;
    op(
      valueA: BaseFunctionModule<DB, TB, any> | T,
      operator: KyselyOperatorExpression,
      valueB: CustomFunctionModule<DB, TB, string> | any,
    ): AndOrExpression;
    fn: CustomFunctionModule<DB, TB, T>;
    /** #### 🔹Checks whether a value or an expression is between two inclusive bounds.
     *
     * @param expr the expression or query-builder function to test (or `undefined` to apply to the current column)
     * @param first the first value or expression
     * @param second the second value or expression
     *
     * ### Example
     * ```ts
     * ::: (expr: N/A, first: $1, second: $2)
     *  //*→ WHERE age is BETWEEN $1 AND $2 ($1=18, $2=30)
     *  criteria({
     *    age: ({ between }) => between(18, 30)
     *  })
     *
     * ::: (expr: ExpressionWrapper => any, first: $1, second: $2)
     *  //*→ WHERE profile.stats.stars BETWEEN $1 AND $2 ($1=1, $2=5)
     *  criteria({
     *    profile: ({ jsonPath, between }) => between(jsonPath().key('stats').key('stars'), 1, 5)
     *  })
     *
     *
     * ::: (expr: qb => any, first: $1, second: $2)
     *  //*→ WHERE amount Order by DESC FROM orders WHERE users.id = orders.user_id is BETWEEN $1 AND $2 ($1=100, $2=500)
     *  criteria({
     *    column_name: ({ between }) =>
     *       between(
     *         ({ selectFrom }) =>
     *           selectFrom('orders')
     *             .select('amount')
     *             .whereRef('orders.user_id', '=', 'users.id')
     *             .orderBy('amount', 'desc')
     *             .limit(1).$asScalar(),
     *         100,
     *         500,
     *       ),
     *  })
     * ```
     */
    between<
      RE extends
        | Expression<any>
        | DynamicReferenceBuilder<any>
        | SelectQueryBuilderExpression<Record<string, any>>
        | OperandExpressionFactory<DB, TB, T>,
      SE,
      EE,
    >(
      expr: RE,
      start: SE,
      end: EE,
    ): AndOrExpression;
    between<SE, EE>(start: SE, end: EE): AndOrExpression;
    /** #### 🔹Checks whether a value or an expression is between two inclusive bounds,
     * 🔸automatically sorting the bounds in ascending order if they’re provided in reverse.
     *
     * @param expr the expression or query-builder function to test (or `undefined` to apply to the current column)
     * @param first the first bound (if greater than `second`, it will be swapped)
     * @param second the second bound (if less than `first`, it will be swapped)
     *
     * ### Example
     *
     * ```ts
     * ::: (expr: N/A, first: $1, second: $2)
     *  //*→ WHERE age is BETWEEN $1 AND $2 ($1=18, $2=30)
     *  criteria({
     *    age: ({ betweenSymmetric }) => betweenSymmetric(30, 18)
     *  })
     *
     * ::: (expr: ExpressionWrapper => any, first: $1, second: $2)
     *  //*→ WHERE profile.stats.stars BETWEEN $1 AND $2 ($1=1, $2=5)
     *  criteria({
     *    profile: ({ jsonPath, betweenSymmetric }) => betweenSymmetric(jsonPath().key('stats').key('stars'), 5, 1)
     *  })
     *
     *
     * ::: (expr: qb => any, first: $1, second: $2)
     *  //*→ WHERE amount Order by DESC FROM orders WHERE users.id = orders.user_id is BETWEEN $1 AND $2 ($1=100, $2=500)
     *  criteria({
     *    column_name: ({ betweenSymmetric }) =>
     *       betweenSymmetric(
     *         ({ selectFrom }) =>
     *           selectFrom('orders')
     *             .select('amount')
     *             .whereRef('orders.user_id', '=', 'users.id')
     *             .orderBy('amount', 'desc')
     *             .limit(1).$asScalar(),
     *         500,
     *         100,
     *       ),
     *  })
     * ```
     */
    betweenSymmetric<
      RE extends
        | Expression<any>
        | DynamicReferenceBuilder<any>
        | SelectQueryBuilderExpression<Record<string, any>>
        | OperandExpressionFactory<DB, TB, T>,
      SE,
      EE,
    >(
      expr: RE,
      start: SE,
      end: EE,
    ): AndOrExpression;
    betweenSymmetric<SE, EE>(start: SE, end: EE): AndOrExpression;
    where: SelectQueryBuilder<DB, TB, T>['where'];
  }

  interface UpdateQueryBuilder<DB, UT extends keyof DB, TB extends keyof DB, O> {
    returning<SE extends SelectExpression<DB, TB>>(
      selections: ReadonlyArray<SE>,
    ): UpdateQueryBuilder<DB, UT, TB, Plugin.MixinAddons.RemoveOptionalUndefined<ReturningRow<DB, TB, O, SE>>>;

    returning<CB extends SelectCallback<DB, TB>>(
      callback: CB,
    ): UpdateQueryBuilder<DB, UT, TB, Plugin.MixinAddons.RemoveOptionalUndefined<ReturningCallbackRow<DB, TB, O, CB>>>;

    returning<SE extends SelectExpression<DB, TB>>(
      selection: SE,
    ): UpdateQueryBuilder<DB, UT, TB, Plugin.MixinAddons.RemoveOptionalUndefined<ReturningRow<DB, TB, O, SE>>>;
  }
}
