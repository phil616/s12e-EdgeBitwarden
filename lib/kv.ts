import { KVStoreSchema } from './types';

const API_URL = process.env.KV_API_URL;
const API_KEY = process.env.KV_API_KEY;
const STORAGE_KEY = 'bitwarden_store';

if (!API_URL || !API_KEY) {
  console.warn('KV_API_URL or KV_API_KEY is missing in environment variables');
}

export async function getStore(): Promise<KVStoreSchema | null> {
  try {
    const res = await fetch(`${API_URL}/${STORAGE_KEY}`, {
      method: 'GET',
      headers: {
        'X-KV-KEY': API_KEY!,
      },
      cache: 'no-store',
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      throw new Error(`KVDB Error: ${res.statusText}`);
    }

    const data = await res.json();
    return data as KVStoreSchema;
  } catch (error) {
    console.error('Failed to get store:', error);
    return null;
  }
}

export async function updateStore(data: KVStoreSchema): Promise<void> {
  const res = await fetch(`${API_URL}/${STORAGE_KEY}`, {
    method: 'PUT', // Try PUT (Update) first
    // However, usually KV stores allow PUT for create-or-replace.
    // Docs: "1. Create (POST)... 3. Update (PUT)".
    // Let's try PUT first, if 404 then POST?
    // Or just use POST if the key might not exist?
    // Let's assume we use PUT for updates. But for the very first time?
    // Let's try to check existence first in the Logic layer.
    // Actually, to be safe, I'll implement a helper that handles "upsert" if possible,
    // but here I'll just expose `put` and `post`.
    headers: {
      'X-KV-KEY': API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  // If PUT fails with 404, we might need POST.
  if (res.status === 404) {
      // Fallback to POST
      const postRes = await fetch(`${API_URL}/${STORAGE_KEY}`, {
        method: 'POST',
        headers: {
          'X-KV-KEY': API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!postRes.ok) {
          throw new Error(`KVDB POST Error: ${postRes.statusText}`);
      }
      return;
  }

  if (!res.ok) {
    throw new Error(`KVDB PUT Error: ${res.statusText}`);
  }
}
