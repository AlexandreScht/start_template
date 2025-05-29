'use server';
import env from '@/config';
import { ClientException } from '@/exceptions/errors';
import { createHmac, randomBytes } from 'crypto';
import { parse, stringify, v4 as uuid } from 'uuid';

const signatureCache = new Set<string>();

export async function setSignature(): Promise<string> {
  const sign = uuid();
  const timestamp = Date.now().toString();
  const nonce = randomBytes(16).toString('hex');

  const payload = `${sign}:${timestamp}:${nonce}`;
  const signBytes = parse(sign);

  signatureCache.add(payload);
  setTimeout(() => signatureCache.delete(payload), 300000);

  return Buffer.from(signBytes).toString('base64');
}

export async function getSignature(signature: string): Promise<string> {
  try {
    const buffedSign = new Uint8Array(Buffer.from(signature, 'base64'));
    return stringify(buffedSign);
  } catch (error) {
    throw new ClientException(400, 'Invalid signature format');
  }
}

export async function verifySignature(signatureBuff: string, signed: string): Promise<boolean> {
  try {
    if (!signatureBuff || !signed) {
      return false;
    }

    const signature = await getSignature(signatureBuff);
    const signatureResolved = createHmac('sha256', env.SIGNATURE).update(signature).digest('hex');

    //? Vérification avec protection contre les attaques de timing
    const expectedLength = signatureResolved.length;
    const actualLength = signed.length;

    if (expectedLength !== actualLength) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < expectedLength; i++) {
      result |= signatureResolved.charCodeAt(i) ^ signed.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    throw new ClientException(500, 'Signature verification failed');
  }
}

export async function cleanExpiredSignatures(): Promise<void> {
  signatureCache.clear();
}
