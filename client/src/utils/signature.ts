'use server';
import { v4 as uuid4, v7 as uuid7 } from 'uuid';
import { loadRsaPublicKey } from './publicKey';

export async function generateSecretValues() {
  // Generate a random AES-128 key and encrypt the value
  const value = uuid4();
  const nonce = uuid7();
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-CBC', length: 128 }, true, ['encrypt', 'decrypt']);

  const iv = new Uint8Array(Buffer.from(nonce.replace(/-/g, ''), 'hex'));
  const encryptedValueBuf = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    aesKey,
    new TextEncoder().encode(value),
  );

  // Encrypt the AES key with the server's RSA public key (RSA-OAEP + SHA-256)
  const serverPublicKey = await loadRsaPublicKey();
  const wrappedAesKeyBuf = await crypto.subtle.wrapKey('raw', aesKey, serverPublicKey, { name: 'RSA-OAEP' });

  const encryptedValue = btoa(String.fromCharCode(...new Uint8Array(encryptedValueBuf)));
  const encryptedAesKey = btoa(String.fromCharCode(...new Uint8Array(wrappedAesKeyBuf)));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    encryptedValue,
    encryptedAesKey,
    nonce,
    value,
    iv: ivBase64,
  };
}
