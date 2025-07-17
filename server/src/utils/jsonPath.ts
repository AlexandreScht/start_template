import { sql } from 'kysely';

export default function jsonPath(pathFn: () => unknown, currentColumn: string, extractValue: boolean = true) {
  const fnString = pathFn.toString();
  const match = fnString.match(/(?:=>|return)\s*[^.]+\.(.+?)(?:\s|$|;|,|})/);

  if (!match) {
    throw new Error('Cannot extract path from function');
  }
  const paths = match[1].split('.');
  const lastKey = paths.pop()!;
  const intermediateKeys = paths;

  let query = sql`${sql.ref(currentColumn)}::jsonb`;
  for (const key of intermediateKeys) {
    query = processJsonKey(query, key, false);
  }
  query = processJsonKey(query, lastKey, extractValue);
  return query;
}

export function processJsonKey(query: any, key: string, extractValue: boolean) {
  const indexMatch = key.match(/\[(\d+)\]$/);

  if (indexMatch) {
    const index = parseInt(indexMatch[1], 10);
    const propertyName = key.replace(/\[\d+\]$/, '');

    if (propertyName) {
      query = sql`${query} -> ${propertyName}`;
      query = sql`${query} ${extractValue ? sql.raw('->>') : sql.raw('->')} ${index}::int`;
    } else {
      query = sql`${query} ${extractValue ? sql.raw('->>') : sql.raw('->')} ${index}::int`;
    }
  } else {
    query = sql`${query} ${extractValue ? sql.raw('->>') : sql.raw('->')} ${key}`;
  }
  return query;
}
