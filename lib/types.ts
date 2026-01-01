// import { AuthenticatorTransportFuture } from '@simplewebauthn/server/helpers';

export type AuthenticatorTransport = 'usb' | 'nfc' | 'ble' | 'internal' | 'hybrid' | 'smart-card';

// --- Client Side Types ---

export type VaultItemType = 'login' | 'note' | 'passkey';

export type CustomFieldType = 'text' | 'hidden' | 'boolean';

export interface CustomField {
  id: string;
  name: string;
  value: string;
  type: CustomFieldType;
}

export type NoteRenderType = 'text' | 'markdown';

export interface VaultItem {
  id: string;
  type: VaultItemType;
  name: string;
  username?: string;
  password?: string;
  uri?: string;
  customFields?: CustomField[]; // For logins
  content?: string; // For notes
  noteRenderType?: NoteRenderType; // For notes
  createdAt: number;
}

export interface VaultData {
  items: VaultItem[];
  updatedAt: number;
}

// --- Server Side Types (KVDB Storage) ---

export interface StoredPasskey {
  id: string; // Base64Url
  publicKey: string; // Base64Url
  counter: number;
  transports?: AuthenticatorTransport[];
  name?: string; // Friendly name for the passkey
  created: number;
}

export interface UserProfile {
  authHash: string; // SHA-256 of PBKDF2 derived key (for login verification)
  salt: string;     // Base64 salt for PBKDF2
  passkeys: StoredPasskey[];
  wrappedMasterKey?: string; // Encrypted MasterKey (Base64) - encrypted by Server Secret
}

export interface EncryptedVault {
  iv: string;   // Base64
  data: string; // Base64 ciphertext
}

export interface KVStoreSchema {
  version: number;
  profile: UserProfile | null;
  vault: EncryptedVault | null;
}
