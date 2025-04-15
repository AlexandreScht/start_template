'use server';
import env from '@/config';
import { ClientException } from '@/exceptions/errors';
import { createHmac } from 'crypto';
import { parse, stringify, v4 as uuid } from 'uuid';

export async function setSignature(): Promise<string> {
  const sign = uuid();
  const signBytes = parse(sign);
  return Buffer.from(signBytes).toString('base64');
}

export async function getSignature(signature: string): Promise<string> {
  const buffedSign = new Uint8Array(Buffer.from(signature, 'base64'));
  return stringify(buffedSign);
}

export async function verifySignature(signatureBuff: string, signed: string): Promise<boolean> {
  try {
    const signature = await getSignature(signatureBuff);
    const signatureResolved = createHmac('sha256', env.SIGNATURE).update(signature).digest('hex');

    return signed === signatureResolved;
  } catch (error) {
    throw new ClientException(500, 'Invalid signature');
  }
}
