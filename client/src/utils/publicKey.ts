import { unstable_cache } from 'next/cache';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Cache the PEM string instead of the CryptoKey
const loadRsaPublicKeyPem = unstable_cache(
  async (): Promise<string> => {
    return await fs.readFile(path.join(process.cwd(), 'public', 'rsa_pub.pem'), 'utf8');
  },
  ['rsa-pem'],
  {
    revalidate: 86400,
    tags: ['crypto-key'],
  },
);

// Convert PEM to CryptoKey (not cached)
export const loadRsaPublicKey = async (): Promise<CryptoKey> => {
  const pem = await loadRsaPublicKeyPem();
  const base64 = pem.replace(/-----(BEGIN|END) (RSA )?PUBLIC KEY-----/g, '').replace(/\s+/g, '');

  const der = Buffer.from(base64, 'base64');
  const binaryDer = new Uint8Array(der);

  return crypto.subtle.importKey('spki', binaryDer.buffer, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, [
    'encrypt',
    'wrapKey',
  ]);
};
