const { cleanEnv, str, port } = require('envalid');

require('dotenv').config();

try {
  cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'test'] }),
    PORT: port(),
    SESSION_SECRET: str(),
    COOKIE_SECRET: str(),
    COOKIE_NAME: str(),
    ORIGIN: str(),
  });
} catch (error: unknown) {
  process.exit(1);
}
