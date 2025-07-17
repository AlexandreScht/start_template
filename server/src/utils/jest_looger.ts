import chalk from 'chalk';
import moment from 'moment-timezone';
import winston from 'winston';

// Définir des niveaux et des couleurs personnalisés pour inclure le niveau 'sql'
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    sql: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    sql: 'blue',
    debug: 'white',
  },
};

// Appliquer les couleurs personnalisées à Winston
winston.addColors(customLevels.colors);

// === TRANSPORT CONSOLE ===
const consoleTransport = new winston.transports.Console({
  level: 'debug',
  handleExceptions: true,
  format: winston.format.combine(
    winston.format.colorize({ level: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => {
      const { timestamp, level, message, sql, parameters, duration, error, stack } = info;

      // Formatage spécial pour les requêtes SQL
      if (level.includes('sql')) {
        let log = `${chalk.gray(timestamp)} ${chalk.blue.bold('[SQL]')} ${chalk.blue(message)}`;
        if (sql) {
          log += `\n  ${chalk.cyan('SQL       :')} ${chalk.white(sql)}`;
        }
        if (parameters && Array.isArray(parameters) && parameters.length > 0) {
          log += `\n  ${chalk.cyan('Parameters:')} ${chalk.yellow(JSON.stringify(parameters))}`;
        }
        if (duration !== undefined) {
          log += `\n  ${chalk.green('Duration  :')} ${duration}ms`;
        }
        return log;
      }

      // Formatage spécial pour les erreurs
      if (level.includes('error')) {
        let log = `${chalk.gray(timestamp)} ${chalk.red.bold(`[ERROR] ${message}`)}`;
        if (sql) {
          log += `\n  ${chalk.cyan('SQL:')} ${chalk.white(sql)}`;
        }
        if (parameters) {
          log += `\n  ${chalk.cyan('Parameters:')} ${chalk.yellow(JSON.stringify(parameters))}`;
        }
        if (duration !== undefined) {
          log += `\n  ${chalk.cyan('Duration:')} ${chalk.yellow(`${duration}ms`)}`;
        }
        if (error) {
          log += `\n  ${chalk.red('Error:')} ${error}`;
        }
        if (stack) {
          log += `\n  ${chalk.red('Stack:')} ${stack}`;
        }
        return log;
      }

      // Formatage par défaut pour les autres niveaux
      return `${chalk.gray(timestamp)} ${level} ${message}`;
    }),
  ),
});

// Création du logger pour la console uniquement
interface CustomLogger extends winston.Logger {
  sql: (message: string, meta?: any) => void;
}

const logger = winston.createLogger({
  levels: customLevels.levels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => moment().tz('Europe/Paris').format('YYYY-MM-DD HH:mm:ss'),
    }),
    winston.format.splat(),
    winston.format.simple(),
  ),
  transports: [consoleTransport],
  silent: false,
}) as CustomLogger;

// Ajouter la méthode sql personnalisée
logger.sql = function (message: string, meta?: any) {
  this.log('sql', message, meta);
};

export { logger };
