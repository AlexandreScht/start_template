import dotenv from 'dotenv';
import { cleanEnv, port, str, url } from 'envalid';
dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development',
  }),
  PORT: port({ default: 3000 }),
  SIGNATURE: str(),
  COOKIE_SECRET: str(),
  COOKIE_NAME: str(),
  REDIS_PASSWORD: str(),
  REDIS_PORT: port({ default: 3000 }),
  SESSION_SECRET: str(),
  ORIGIN: url(),
});

export default env;
