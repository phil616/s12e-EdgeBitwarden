import crypto from 'crypto';

// Server-side secret key for wrapping the user's Master Key
// In production, this should be a secure environment variable or HSM
const SERVER_SECRET_KEY = process.env.KV_API_KEY;

if (!SERVER_SECRET_KEY) {
  throw new Error('KV_API_KEY environment variable is not set');
}

// We use AES-256-GCM for wrapping
const ALGORITHM = 'aes-256-gcm';

export function wrapKey(plainTextKey: string): string {
  const iv = crypto.randomBytes(12);
  // Key derivation from the server secret
  const key = crypto.createHash('sha256').update(SERVER_SECRET_KEY).digest();
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainTextKey, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();
  
  // Format: IV:AuthTag:Ciphertext (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function unwrapKey(wrappedKey: string): string {
  const parts = wrappedKey.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid wrapped key format');
  }
  
  const [ivB64, authTagB64, encryptedB64] = parts;
  
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  
  const key = crypto.createHash('sha256').update(SERVER_SECRET_KEY).digest();
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedB64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
