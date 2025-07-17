import { ServerException } from '@/exceptions';
import jsonPath from '@/utils/jsonPath';
import { sql, type ExpressionBuilder } from 'kysely';

export enum DateUnit {
  Year = 'year',
  Month = 'month',
  Day = 'day',
  Hour = 'hour',
  Minute = 'minute',
  Second = 'second',
  Century = 'century',
  Decade = 'decade',
  Dow = 'dow',
  Doy = 'doy',
  Epoch = 'epoch',
  IsoDow = 'isodow',
  IsoYear = 'isoyear',
  Microseconds = 'microseconds',
  Millennium = 'millennium',
  Milliseconds = 'milliseconds',
  Quarter = 'quarter',
  Timezone = 'timezone',
  TimezoneHour = 'timezone_hour',
  TimezoneMinute = 'timezone_minute',
  Week = 'week',
}

export enum ConversionType {
  Varchar = 'varchar',
  Char = 'char',
  Text = 'text',
  Integer = 'integer',
  Bigint = 'bigint',
  Decimal = 'decimal',
  Numeric = 'numeric',
  Real = 'real',
  Double = 'double',
  Boolean = 'boolean',
  Date = 'date',
  Timestamp = 'timestamp',
  Time = 'time',
  Json = 'json',
  Jsonb = 'jsonb',
}

export default class ChainableFnExpressionBuilder {
  private static eb?: ExpressionBuilder<any, any>;

  private static createChainable(expr: any) {
    return {
      ...this.fnMethodList(expr),
      __isChainableFn: true,
      __expression: expr,
    };
  }

  private static fnMethodList(currentColumn: any) {
    if (!this?.eb) throw new ServerException(500, 'Expression builder missing');
    const eb = this.eb;
    return {
      upper: () => this.createChainable(eb.fn<string>('upper', [currentColumn])),
      lower: () => this.createChainable(eb.fn<string>('lower', [currentColumn])),
      initcap: () => this.createChainable(eb.fn<string>('initcap', [currentColumn])),
      concat: (callback: (col: any) => any[]) => {
        const values = callback(currentColumn);
        if (!Array.isArray(values)) {
          throw new Error('La fonction callback doit retourner un tableau de valeurs');
        }
        const processedValues = values.map(v => {
          if (v === currentColumn || (v && typeof v === 'object' && 'expressionType' in v)) {
            return eb.cast(v as any, 'text');
          }
          return eb.cast(eb.val(v), 'text');
        });
        return this.createChainable(eb.fn<string>('concat', processedValues));
      },

      substring: (start: number, length?: number) =>
        this.createChainable(
          length !== undefined
            ? eb.fn<string>('substring', [currentColumn, eb.val(start), eb.val(length)])
            : eb.fn<string>('substring', [currentColumn, eb.val(start)]),
        ),

      left: (length: number) => this.createChainable(eb.fn<string>('left', [currentColumn, eb.val(length)])),
      right: (length: number) => this.createChainable(eb.fn<string>('right', [currentColumn, eb.val(length)])),
      trim: () => this.createChainable(eb.fn<string>('trim', [currentColumn])),
      ltrim: () => this.createChainable(eb.fn<string>('ltrim', [currentColumn])),
      rtrim: () => this.createChainable(eb.fn<string>('rtrim', [currentColumn])),
      replace: (oldValue: string, newValue: string) =>
        this.createChainable(eb.fn<string>('replace', [currentColumn, eb.val(oldValue), eb.val(newValue)])),
      reverse: () => this.createChainable(eb.fn<string>('reverse', [currentColumn])),
      repeat: (count: number) => this.createChainable(eb.fn<string>('repeat', [currentColumn, eb.val(count)])),

      //* === Informations sur les chaînes ===
      length: () => this.createChainable(eb.fn<number>('length', [currentColumn])),
      position: (searchString: string) =>
        this.createChainable(eb.fn<number>('strpos', [currentColumn, eb.val(searchString)])),

      //* === Fonctions Numériques ===
      abs: () => this.createChainable(eb.fn<number>('abs', [currentColumn])),
      round: (precision?: number) =>
        this.createChainable(
          precision !== undefined
            ? eb.fn<number>('round', [currentColumn, eb.val(precision)])
            : eb.fn<number>('round', [currentColumn]),
        ),
      floor: () => this.createChainable(eb.fn<number>('floor', [currentColumn])),
      ceil: () => this.createChainable(eb.fn<number>('ceil', [currentColumn])),
      trunc: (precision?: number) =>
        this.createChainable(
          precision !== undefined
            ? eb.fn<number>('trunc', [currentColumn, eb.val(precision)])
            : eb.fn<number>('trunc', [currentColumn]),
        ),
      mod: (divisor: number) => this.createChainable(eb.fn<number>('mod', [currentColumn, eb.val(divisor)])),
      power: (exponent: number) => this.createChainable(eb.fn<number>('power', [currentColumn, eb.val(exponent)])),
      sqrt: () => this.createChainable(eb.fn<number>('sqrt', [currentColumn])),
      sign: () => this.createChainable(eb.fn<number>('sign', [currentColumn])),

      //* === Fonctions Trigonométriques ===
      sin: () => this.createChainable(eb.fn<number>('sin', [currentColumn])),
      cos: () => this.createChainable(eb.fn<number>('cos', [currentColumn])),
      tan: () => this.createChainable(eb.fn<number>('tan', [currentColumn])),
      asin: () => this.createChainable(eb.fn<number>('asin', [currentColumn])),
      acos: () => this.createChainable(eb.fn<number>('acos', [currentColumn])),
      atan: () => this.createChainable(eb.fn<number>('atan', [currentColumn])),

      //* === Fonctions de Date/Heure ===
      current_timestamp: () => this.createChainable(sql`CURRENT_TIMESTAMP`),
      current_date: () => this.createChainable(sql`CURRENT_DATE`),
      current_time: () => this.createChainable(sql`CURRENT_TIME`),
      date_part: (unit: DateUnit) => {
        if (!Object.values(DateUnit).includes(unit)) {
          throw new Error(`Invalid date unit: ${unit}`);
        }
        return this.createChainable(eb.fn<number>('date_part', [eb.val(unit), currentColumn]));
      },
      year: () => this.createChainable(sql`extract(year from ${sql.ref(currentColumn)})`),
      month: () => this.createChainable(sql`extract(month from ${sql.ref(currentColumn)})`),
      day: () => this.createChainable(sql`extract(day from ${sql.ref(currentColumn)})`),
      date_format: (format: string) => this.createChainable(eb.fn<string>('to_char', [currentColumn, eb.val(format)])),
      date_add: (interval: number, unit: DateUnit) => {
        if (!Object.values(DateUnit).includes(unit)) {
          throw new Error(`Invalid date unit: ${unit}`);
        }
        const columnExpression = typeof currentColumn === 'string' ? sql.ref(currentColumn) : currentColumn;
        return this.createChainable(
          sql`(${columnExpression} + INTERVAL '${sql.raw(String(interval))} ${sql.raw(unit)}')`,
        );
      },

      date_sub: (interval: number, unit: DateUnit) => {
        if (!Object.values(DateUnit).includes(unit)) {
          throw new Error(`Invalid date unit: ${unit}`);
        }
        const columnExpression = typeof currentColumn === 'string' ? sql.ref(currentColumn) : currentColumn;
        return this.createChainable(
          sql`(${columnExpression} - INTERVAL '${sql.raw(String(interval))} ${sql.raw(unit)}')`,
        );
      },
      age: (compareDate?: any) =>
        this.createChainable(
          compareDate ? eb.fn('age', [currentColumn, eb.val(compareDate)]) : eb.fn('age', [currentColumn]),
        ),

      // === Fonctions Conditionnelles ===
      coalesce: (values: any[]) => {
        const refs = values.map(val => {
          if (typeof val === 'function') {
            const result = val();
            return sql.ref(result);
          }
          return eb.val(val);
        });

        return this.createChainable(sql`coalesce(${sql.join([sql.ref(currentColumn), ...refs])})`);
      },
      nullif: (compareValue: any) => this.createChainable(eb.fn<any>('nullif', [currentColumn, eb.val(compareValue)])),
      greatest: (values: any[]) => {
        const refs = values.map(val => {
          if (typeof val === 'function') {
            const result = val();
            return sql.ref(result);
          }
          return eb.val(val);
        });
        return this.createChainable(eb.fn<any>('greatest', [currentColumn, ...refs]));
      },
      smallest: (values: any[]) => {
        const refs = values.map(val => {
          if (typeof val === 'function') {
            const result = val();
            return sql.ref(result);
          }
          return eb.val(val);
        });
        return this.createChainable(eb.fn<any>('least', [currentColumn, ...refs]));
      },

      // === Fonctions de Conversion ===
      convert: (type: ConversionType) => {
        if (!Object.values(ConversionType).includes(type)) {
          throw new Error(`Invalid date unit: ${type}`);
        }
        return this.createChainable(sql`cast(${sql.ref(currentColumn)} as ${sql.raw(type)})`);
      },
      to_number: (format?: string) =>
        this.createChainable(
          format
            ? eb.fn<number>('to_number', [currentColumn, eb.val(format)])
            : eb.fn<number>('to_number', [currentColumn]),
        ),

      // === Fonctions JSON ===
      json_get: (pathFn: () => unknown) => this.createChainable(jsonPath(pathFn, currentColumn)),
      json_array_length: (pathFn: () => unknown) =>
        this.createChainable(eb.fn<number>('jsonb_array_length', [jsonPath(pathFn, currentColumn, false)])),
      json_typeof: (pathFn: () => unknown) =>
        this.createChainable(eb.fn<string>('jsonb_typeof', [jsonPath(pathFn, currentColumn, false)])),
    };
  }

  static exec<DB, TB extends keyof DB>(expression: any, eb: ExpressionBuilder<DB, TB>) {
    this.eb = eb;
    return this.createChainable(expression);
  }
}
