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
    API_KEY: str(),
    API_SECRET: str(),
    API_Passphrase: str(),
    API_MARKET: str(),
  });
} catch (error: unknown) {
  process.exit(1);
}
