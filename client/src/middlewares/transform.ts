// transform.ts
import moment from 'moment';

/* ============================
   DEFAULT TRANSFORMERS
   ============================
*/
//? String transformers
const trim = (value: string): string => value.trim();
const uppercase = (value: string): string => value.toUpperCase();
const lowercase = (value: string): string => value.toLowerCase();
const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
const toSnakeCase = (value: string): string => value.replace(/\W+/g, ' ').trim().split(/\s+/).join('_').toLowerCase();
const toCamelCase = (value: string): string =>
  value
    .toLowerCase()
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase()))
    .replace(/\s+/g, '');

//? Number transformers
const round = (value: number): number => Math.round(value);
const fixed = (value: number, decimals: number = 2): string => value.toFixed(decimals);
const increment = (value: number, incrementValue: number = 1): number => value + incrementValue;
const multiply = (value: number, factor: number): number => value * factor;

//? Array transformers
const unique = <T>(arr: T[]): T[] => Array.from(new Set(arr));
const sort = <T>(arr: T[]): T[] => [...arr].sort();

//? Date transformers
const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => moment(date).format(format);

export const defaultTransformers = {
  string: {
    trim,
    uppercase,
    lowercase,
    capitalize,
    snakeCase: toSnakeCase,
    camelCase: toCamelCase,
  },
  number: {
    round,
    fixed,
    increment,
    multiply,
  },
  array: {
    unique,
    sort,
  },
  date: {
    formatDate,
  },
};

export function transform<T>(fn: (data: T, options?: typeof defaultTransformers) => T, data: T): T {
  return fn(data, defaultTransformers);
}
