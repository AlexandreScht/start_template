import chalk from 'chalk';
import moment from 'moment-timezone';
import winston from 'winston';

const isDevelopment = process.env.NODE_ENV === 'development';

const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  let coloredLevel: string;
  switch (level) {
    case 'error':
      coloredLevel = chalk.red(level);
      break;
    case 'warn':
      coloredLevel = chalk.yellow(level);
      break;
    case 'info':
      coloredLevel = chalk.blue(level);
      break;
    default:
      coloredLevel = level;
  }
  return `${timestamp} ${coloredLevel}: ${message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: () => moment().tz('Europe/Paris').format('YYYY-MM-DD HH:mm:ss'),
    }),
    logFormat,
  ),
  transports: isDevelopment ? [new winston.transports.Console()] : [],
});

if (!isDevelopment) {
  logger.silent = true;
}

export { logger };
