import { NextResponse } from 'next/server';
import { getStore, updateStore } from '@/lib/kv';
import { KVStoreSchema } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { authHash, salt } = await request.json();

    if (!authHash || !salt) {
      return NextResponse.json({ error: '缺少认证哈希或盐值 (authHash or salt)' }, { status: 400 });
    }

    const store = await getStore();
    if (store && store.profile) {
      return NextResponse.json({ error: '用户已初始化' }, { status: 400 });
    }

    const newStore: KVStoreSchema = {
      version: 1,
      profile: {
        authHash,
        salt,
        passkeys: [],
      },
      vault: null,
    };

    await updateStore(newStore);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

export async function GET() {
    // Check status
    const store = await getStore();
    return NextResponse.json({ initialized: !!(store && store.profile) });
}
