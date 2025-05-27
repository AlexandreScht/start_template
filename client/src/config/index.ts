import dotenv from 'dotenv';
import { cleanEnv, port, str, url } from 'envalid';
dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production'],
    default: 'development',
  }),
  PORT: port({ default: 3000 }),
  SERVER_URI: url({ default: 'http://localhost:3005' }),
  SIGNATURE: str(),
  COOKIE: str({ default: 'template_starter' }),
  NEXTAUTH_URL: str({ default: 'http://localhost:3000/' }),
  NEXTAUTH_SECRET: str(),
});

export default env;
