// libs/privateKey.ts
import { createPrivateKey, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let keyCache: KeyObject | null = null;

/**
 * Renvoie le KeyObject de la clé privée RSA (cached).
 * @param pemPath chemin absolu ou relatif vers private.pem
 */
export function getPrivateKey(pemPath = './private.pem'): KeyObject {
  if (keyCache) return keyCache;

  const pem = readFileSync(resolve(pemPath), 'utf8');

  keyCache = createPrivateKey({ key: pem, format: 'pem' });
  return keyCache;
}
