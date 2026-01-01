import { NextResponse } from 'next/server';
import { getStore, updateStore } from '@/lib/kv';
import { EncryptedVault } from '@/lib/types';

export async function GET() {
  const store = await getStore();
  if (!store || !store.profile) {
    return NextResponse.json({ error: '用户未初始化' }, { status: 404 });
  }
  return NextResponse.json({ vault: store.vault });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Body should be { iv: string, data: string } (EncryptedVault)
    const vaultData = body as EncryptedVault;

    if (!vaultData.iv || !vaultData.data) {
        return NextResponse.json({ error: '无效的密码库数据' }, { status: 400 });
    }

    const store = await getStore();
    if (!store) {
        return NextResponse.json({ error: '存储未找到' }, { status: 404 });
    }

    // Update just the vault part
    store.vault = vaultData;
    await updateStore(store);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vault sync error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
