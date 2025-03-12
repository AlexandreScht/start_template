import dotenv from 'dotenv';
import { cleanEnv, host, port, str, url } from 'envalid';
dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production'],
    default: 'development',
  }),
  PORT: port({ default: 3000 }),
  SERVER_URI: url(),
  COOKIE: str(),
  //? Redis
  REDIS_PORT: port({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '' }),
  REDIS_HOST: host(),
});

export default env;
