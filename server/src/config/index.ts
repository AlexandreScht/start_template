import dotenv from 'dotenv';
import { cleanEnv, port, str, url } from 'envalid';
dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development',
  }),
  PORT: port({ default: 3005 }),
  SIGNATURE: str(),
  COOKIE_SECRET: str(),
  COOKIE_NAME: str({ default: 'template_starter' }),
  REDIS_PASSWORD: str({ default: '' }),
  REDIS_HOST: str({ default: '127.0.0.1' }),
  REDIS_PORT: port({ default: 6379 }),
  SESSION_SECRET: str(),
  ORIGIN: url({ default: 'http://localhost:3000' }),
  // Google oAuth2o
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
});

export default env;
