#!/usr/bin/env ts-node

import chalk from 'chalk';
import { promises as fs, readFileSync } from 'fs';
import { type CompositeProperty, processDatabase } from 'kanel';
import { kyselyTypeFilter, makeKyselyHook } from 'kanel-kysely';
import { FileMigrationProvider, Kysely, Migrator, PostgresDialect } from 'kysely';
import path from 'path';
import { Pool } from 'pg';
import { Writable } from 'stream';
import dbConfig from '../config/db';
import type Database from '../types/models/Database';

const bindOutput = () => {
  const devnull = new Writable({
    write(chunk, enc, cb) {
      cb();
    },
  });
  const originalStdout = process.stdout.write;
  const originalStderr = process.stderr.write;
  process.stdout.write = devnull.write.bind(devnull);
  process.stderr.write = devnull.write.bind(devnull);

  return { originalStdout, originalStderr };
};

export async function migrate(rollBack?: boolean) {
  // 1️⃣ Connexion DB
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new Pool(dbConfig) }),
  });

  // 2️⃣ Configuration du migrator
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.resolve(__dirname, 'migrations'),
    }),
  });

  if (rollBack) {
    try {
      console.debug(chalk.yellow('🡆 Début du rollback'));
      const { error, results } = await migrator.migrateDown();

      if (!results || !results?.length) {
        console.debug(chalk.cyan('ℹ️ aucun rollback à effectuer.'));
        return;
      }

      const [{ migrationName, status }] = results || [];
      if (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`❌ ${migrationName} rollback => ${msg}`));
        throw new Error();
      }

      console.debug(chalk.green('✅ Rollback appliqué sur :'));
      console.debug(`   • ${chalk.magenta(migrationName)} → ${chalk.green(status)}`);
      return;
    } catch (error) {
      console.debug(error);
    }
  } else {
    console.debug(chalk.yellow('🡆 Début de la migration'));
    const { error, results } = await migrator.migrateUp();
    if (!results || !results?.length) {
      console.debug(chalk.cyan('ℹ️ aucune migration à appliquer.'));
      return;
    }
    const [{ migrationName, status }] = results || [];

    if (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ ${migrationName} migration => ${msg}`));
      throw new Error();
    }
    console.debug(chalk.green('✅ Migrations appliquées :'));
    console.debug(`   • ${chalk.magenta(migrationName)} → ${chalk.green(status)}`);
    console.debug(chalk.yellow('🡆 Génération du typage de la database'));
    const { originalStdout, originalStderr } = bindOutput();
    const processedColumns = new Set();
    const jsonbKeysCache = new Set();
    try {
      const jsonbFilePath = path.resolve(__dirname, '../types/jsonb.d.ts');
      const fileContent = readFileSync(jsonbFilePath, 'utf-8');
      const keys = extractJsonbKeys(fileContent);
      keys.forEach(key => {
        jsonbKeysCache.add(key);
      });

      const isOptional = (property: CompositeProperty): boolean => {
        return property?.isIdentity || property?.defaultValue;
      };

      await processDatabase({
        enumStyle: 'type',
        connection: dbConfig,
        preDeleteOutputFolder: true,
        schemas: ['public'],
        outputPath: path.resolve(__dirname, '../types/models'),
        typeFilter: kyselyTypeFilter,
        preRenderHooks: [makeKyselyHook()],
        getPropertyMetadata: property => {
          if (property.type?.fullName === 'pg_catalog.jsonb') {
            const tableName = (property as any).informationSchemaValue?.table_name || 'unknown';
            const columnKey = `${tableName}.${property.name}`;

            if (!processedColumns.has(columnKey)) {
              processedColumns.add(columnKey);
              const key = `${tableName}_${property.name}`;
              return {
                name: property.name,
                typeOverride: jsonbKeysCache.has(key) ? `JSONB["${key}"] | object` : 'object',
                nullableOverride: property.isNullable,
                comment: property.comment ? [property.comment] : undefined,
                optionalOverride: isOptional(property),
              };
            }
          }

          return {
            name: property.name,
            nullableOverride: property.isNullable,
            comment: property.comment ? [property.comment] : undefined,
            optionalOverride: isOptional(property),
          };
        },

        postRenderHooks: [
          (filePath: string, lines: string[]): string[] => {
            if (!filePath.endsWith('.ts')) return lines;
            const processedLines: string[] = [];

            for (const line of lines) {
              if (
                /import\s+type\s+\{[^}]*\b(ColumnType|Selectable|Insertable|Updateable)\b[^}]*\}\s+from\s+['"]kysely['"]/.test(
                  line,
                )
              ) {
                continue;
              }

              let processedLine = line;

              if (/^export\s+type\s+\w+Id\s*=/.test(processedLine)) {
                processedLine = processedLine.replace(
                  /^export\s+type\s+(\w+Id)\s*=\s*([^&]+)&\s*\{\s*__brand:[^}]+\};$/,
                  'export type $1 = $2;',
                );
              }

              if (/:?\s*ColumnType</.test(processedLine)) {
                processedLine = processedLine.replace(/ColumnType<\s*([^,>]+)[^>]*>/g, '$1');
              }

              if (/^export\s+type\s+\w+\s*=\s*(Selectable|Insertable|Updateable)<.*>;$/.test(processedLine)) {
                continue;
              }

              if (processedLine.includes('Date')) {
                processedLine = processedLine.replace(/\bDate\b(?!\w)/g, 'Date | number | string');
                processedLine = processedLine.replace(/(Date \| number \| string)( \| null)/g, '$1$2');
              }

              if (processedLine.trim() !== '') {
                processedLines.push(processedLine);
              }
            }

            const content = processedLines.join('\n');
            const needsJSONBImport = /\bJSONB\b/.test(content);

            const hasJSONBImport = processedLines.some(
              line => line.includes('import') && line.includes('JSONB') && line.includes('../../../interfaces/models'),
            );

            const result: string[] = [];

            if (needsJSONBImport && !hasJSONBImport) {
              result.push(`import type { JSONB } from '../../jsonb';`);
              result.push('');
            }

            result.push(...processedLines);

            return result;
          },
        ],
      });
      process.stdout.write = originalStdout;
      process.stderr.write = originalStderr;
      console.debug(chalk.green('✅ Types générés avec succès.'));
      return;
    } catch (e) {
      process.stdout.write = originalStdout;
      process.stderr.write = originalStderr;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(chalk.red(`❌ Échec de la génération des types : ${msg}`));
      throw new Error();
    } finally {
      jsonbKeysCache.clear();
      processedColumns.clear();
    }
  }
}

function extractJsonbKeys(fileContent: string): string[] {
  const keys: string[] = [];
  const interfaceMatch = fileContent.match(/interface\s+JSONB\s*\{([^}]+)\}/s);

  if (interfaceMatch) {
    const interfaceBody = interfaceMatch[1];
    const propertyRegex =
      /(?:^|\s+)(?:readonly\s+)?(?:"([^"]+)"|'([^']+)'|([a-zA-Z_$][a-zA-Z0-9_$]*))(?:\?)?:\s*[^;]+;/gm;

    let match;
    while ((match = propertyRegex.exec(interfaceBody)) !== null) {
      const propertyName = match[1] || match[2] || match[3];
      if (propertyName) {
        keys.push(propertyName);
      }
    }
  }

  return keys;
}

// Point d’entrée
if (process.argv.includes('--trml')) {
  migrate(process.argv.includes('--down'))
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
