import { DeepStringify } from '@/interfaces/config';
import dotenv from 'dotenv';
dotenv.config();

const config = makeDeepStringify({
  SERVER_URI: process.env.SERVER_URI,
  COOKIE: process.env.COOKIE_NAME,
});

function makeDeepStringify<T>(obj: T): DeepStringify<T> {
  return obj as DeepStringify<T>;
}
export default config;
