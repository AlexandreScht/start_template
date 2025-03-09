import { DeepStringify } from '@/interfaces/config';
import dotenv from 'dotenv';
dotenv.config();

const config = makeDeepStringify({
  security: {
    cookie: {
      COOKIE_SECRET: process.env.COOKIE_SECRET,
      COOKIE_NAME: process.env.COOKIE_NAME,
    },
    session: {
      SESSION_SECRET: process.env.SESSION_SECRET,
    },
  },
  server: {
    ORIGIN: process.env.ORIGIN,
  },
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
});

function makeDeepStringify<T>(obj: T): DeepStringify<T> {
  return obj as DeepStringify<T>;
}
export default config;
