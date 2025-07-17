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
  CAPTCHA_SECRET_KEY: str(),
  // Mailer
  MAILER_HOST: str(),
  MAILER_PORT: port({ default: 587 }),
  MAILER_USER: str(),
  MAILER_PASSWORD: str(),
  MAILER_FROM: str(),
  MAILER_SUPPORT: str({ default: 'supprt-company@gmail.com' }),
  // Database

  DB_USER: str({ default: 'postgres' }),
  DB_PASSWORD: str(),
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: port({ default: 5432 }),
  DB_DATABASE: str(),
});

export default env;
