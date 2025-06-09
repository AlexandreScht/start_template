import dotenv from 'dotenv';
import { cleanEnv, port, str } from 'envalid';
dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'production'],
    default: 'development',
  }),
  PORT: port({ default: 3000 }),
  BACKEND: str({
    default: 'http://localhost:3005',
  }),
});

export default env;
