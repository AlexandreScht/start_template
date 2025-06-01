import { InvalidArgumentError } from '@/exceptions';
import RedisInstance from '@/libs/redis';
import { getPrivateKey } from '@/utils/privateKey';
import { constants, createDecipheriv, privateDecrypt, timingSafeEqual } from 'crypto';
import type { Request } from 'express';

const WINDOW_MS = 5 * 60_000;
const PRIVATE_KEY = getPrivateKey('./src/keys/private.pem');

function extractTimestampFromUuidV7(uuid7: string): number {
  const hex = uuid7.replace(/-/g, '').slice(0, 12);
  return parseInt(hex, 16);
}

export default async function verifySignature(req: Request) {
  const redis = RedisInstance.getInstance();

  const unique = req.headers['x-sign-value'] as string;
  const encryptedValue = req.headers['x-sign-value-cipher'] as string;
  const encryptedAesKey = req.headers['x-sign-key-cipher'] as string;
  const nonce = req.headers['x-sign-nonce'] as string;

  if (!unique || !encryptedValue || !encryptedAesKey || !nonce) {
    throw new InvalidArgumentError();
  }

  //* ---- 2. Fenêtre de validité (5 min) --------------------------------
  const stamp = extractTimestampFromUuidV7(nonce);
  if (Math.abs(Date.now() - stamp) > WINDOW_MS) {
    throw new InvalidArgumentError();
  }

  //* ---- 3. Anti-replay avec Redis (NX + EX 300 s) ----------------------
  const setResult = await redis.set(nonce, '1', { NX: true, EX: 300 });
  if (setResult === null) {
    throw new InvalidArgumentError();
  }

  //* ---- 4. Déchiffrement RSA-OAEP → clé AES ----------------------------
  const aesKeyRaw = privateDecrypt(
    {
      key: PRIVATE_KEY,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encryptedAesKey, 'base64'),
  );

  //* ---- 5. Déchiffrement AES-128-CBC de la valeur ---------------------
  const iv = Buffer.from(nonce.replace(/-/g, ''), 'hex');
  const decipher = createDecipheriv('aes-128-cbc', aesKeyRaw, iv);
  const valueBuf = Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64')), decipher.final()]);

  //* ---- 6. Comparaison temps-constant ----------------------------------
  const clearBuf = Buffer.from(unique, 'utf-8');
  if (clearBuf.length !== valueBuf.length || !timingSafeEqual(clearBuf, valueBuf)) {
    throw new InvalidArgumentError('Signature mismatch');
  }

  return;
}
