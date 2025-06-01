// node generate-keys.js
const { generateKeyPairSync } = require('node:crypto');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

require('fs').writeFileSync('./keys/public.pem', publicKey);
require('fs').writeFileSync('./keys/private.pem', privateKey);

console.log('✓ paires de clés générées dans ./keys/');
