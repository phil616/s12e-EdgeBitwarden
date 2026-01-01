import { NextResponse } from 'next/server';
import { getStore } from '@/lib/kv';

export async function GET() {
  try {
    const store = await getStore();
    
    if (!store || !store.profile) {
      return NextResponse.json({ error: '用户未初始化' }, { status: 400 });
    }

    return NextResponse.json({ salt: store.profile.salt });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
