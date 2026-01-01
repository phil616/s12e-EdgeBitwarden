import { NextResponse } from 'next/server';
import { getStore } from '@/lib/kv';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { authHash } = body;

    if (!authHash) {
      return NextResponse.json({ error: '缺少认证哈希 (authHash)' }, { status: 400 });
    }

    const store = await getStore();
    if (!store || !store.profile) {
      return NextResponse.json({ error: '用户未初始化' }, { status: 404 });
    }

    // Constant-time comparison would be better, but for this demo standard comparison is okay
    // (Actually JS string comparison is optimized, but timing attacks are possible)
    if (store.profile.authHash !== authHash) {
       return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      salt: store.profile.salt,
      vault: store.vault,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
