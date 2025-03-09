/* eslint-disable @typescript-eslint/no-var-requires */
// validateEnv.js
const { cleanEnv, str, port } = require('envalid');
require('dotenv').config();

try {
  cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ['development', 'production'],
      default: 'development',
    }),
    PORT: port({ default: 3000 }),
    SERVER_URI: str(),
  });
} catch (error) {
  process.exit(1);
}
