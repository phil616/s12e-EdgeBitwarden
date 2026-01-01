import { bufferToBase64, base64ToBuffer } from './utils';
import { VaultData } from './types';

const PBKDF2_ITERATIONS = 600000;
const SALT_LEN = 16;
const IV_LEN = 12;

// --- Key Derivation ---

export async function generateSalt(): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
  return bufferToBase64(salt.buffer);
}

export async function deriveMasterKey(password: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey', 'deriveBits']
  );

  const saltBuffer = base64ToBuffer(saltBase64);

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true, // Master Key must be extractable for Passkey Wrapping
    ['encrypt', 'decrypt']
  );
}

export async function exportMasterKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(exported);
}

export async function importMasterKey(jwkStr: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkStr);
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

// --- Auth Hash (for server verification) ---

export async function deriveAuthHash(password: string, saltBase64: string): Promise<string> {
  // We derive a separate key for auth so the server never sees the encryption key material
  // Actually, standard practice: Hash(MasterKey) or similar.
  // Here, we'll just run PBKDF2 again with a different "pepper" or just SHA-256 the Key?
  // Cannot export the key.
  // Let's derive a DIFFERENT key for Auth using the same password but maybe different params?
  // Or simply: 
  // 1. Derive MasterKey. 
  // 2. Encrypt a constant string "AUTH_VERIFY" with MasterKey.
  // 3. Send the result. 
  // Server checks if it can decrypt? No, server doesn't have the key.
  
  // Bitwarden approach: 
  // MasterKey = PBKDF2(password, salt)
  // MasterPasswordHash = PBKDF2(MasterKey, password, 1 iter) -> Send to server.
  // Since our MasterKey is non-extractable, we can't feed it back easily without exporting.
  
  // Simplified approach for this demo:
  // AuthHash = SHA-256(password + salt + "AUTH")
  // This is distinct from MasterKey.
  
  const enc = new TextEncoder();
  const data = enc.encode(password + saltBase64 + 'AUTH_SUFFIX');
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

// --- Encryption / Decryption ---

export async function encryptVault(vault: VaultData, key: CryptoKey): Promise<{ iv: string; data: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));
  const enc = new TextEncoder();
  const dataBuffer = enc.encode(JSON.stringify(vault));

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    dataBuffer
  );

  return {
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(cipherBuffer),
  };
}

export async function decryptVault(ivBase64: string, dataBase64: string, key: CryptoKey): Promise<VaultData> {
  const iv = base64ToBuffer(ivBase64);
  const data = base64ToBuffer(dataBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as VaultData;
}
