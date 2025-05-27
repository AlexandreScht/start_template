// src/utils/logger.ts
import chalk from 'chalk';
import log from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import moment from 'moment-timezone';

const isServer = typeof window === 'undefined';

if (isServer) {
  prefix.reg(log);
  console.log(chalk.hex('#87CEEB')('-'.repeat(process.stdout.columns)));
  prefix.apply(log, {
    format: (_level: string): string => {
      const currentTimestamp = moment(new Date()).tz('Europe/Paris').format('YYYY-MM-DD HH:mm:ss');
      let coloredLevel: string;
      switch (_level.toLowerCase()) {
        case 'error':
          coloredLevel = chalk.red(_level.toUpperCase());
          break;
        case 'warn':
          coloredLevel = chalk.hex('#FFA500')(_level.toUpperCase());
          break;
        case 'info':
          coloredLevel = chalk.hex('#69cf8c')(_level.toUpperCase());
          break;
        default:
          coloredLevel = chalk.white(_level.toUpperCase());
      }
      return `${chalk.grey(currentTimestamp)} ${coloredLevel}`;
    },
  });
  const originalFactory = log.methodFactory;
  const formatMessageContentServer = (msg: string): string => {
    msg = msg.replace(/\[(GET|POST|PUT|DELETE)\]/gi, match => chalk.hex('#b4b3b3')(match));
    msg = msg.replace(/(Params:\s*)([^-]+)/i, (_match, p1, p2) => chalk.hex('#b4b3b3')(p1) + chalk.cyan(p2.trim()));
    msg = msg.replace(/(Data:\s*)(.*)$/i, (_match, p1, p2) => chalk.hex('#b4b3b3')(p1) + chalk.cyan(p2.trim()));
    return msg;
  };
  log.methodFactory = function (methodName, logLevel, loggerName) {
    const rawMethod = originalFactory(methodName, logLevel, loggerName);
    return function (...args: any[]) {
      if (typeof args[0] === 'string') {
        args[0] = formatMessageContentServer(args[0]);
      }
      rawMethod.apply(null, args);
    };
  };
  log.setLevel(log.getLevel());
} else {
  prefix.apply(log, {
    format: (_level: string): string => {
      const currentTimestamp = moment(new Date()).tz('Europe/Paris').format('YYYY-MM-DD HH:mm:ss');
      return `%c${currentTimestamp} ${_level.toUpperCase()}`;
    },
  });
  const originalFactory = log.methodFactory;
  log.methodFactory = function (methodName, logLevel, loggerName) {
    const rawMethod = originalFactory(methodName, logLevel, loggerName);
    return function (...args: any[]) {
      let style = '';
      switch (methodName.toLowerCase()) {
        case 'error':
          style = 'color: red';
          break;
        case 'warn':
          style = 'color: orange';
          break;
        case 'info':
          style = 'color: skyblue';
          break;
        default:
          style = '';
      }
      if (typeof args[0] === 'string' && args[0].startsWith('%c')) {
        rawMethod.apply(null, [args[0], style, ...args.slice(1)]);
      } else {
        rawMethod.apply(null, args);
      }
    };
  };
  log.setLevel(log.getLevel());
}

log.setLevel('info');

export { log as logger };
