import dotenv from 'dotenv';
import { cleanEnv, port, str, url } from 'envalid';
dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production'],
    default: 'development',
  }),
  PORT: port({ default: 3000 }),
  SERVER_URI: url(),
  COOKIE: str(),
});

export default env;
