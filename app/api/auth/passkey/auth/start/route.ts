import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getStore } from '@/lib/kv';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';

export async function GET() {
  try {
    const store = await getStore();
    if (!store || !store.profile) {
       return NextResponse.json({ error: '用户未初始化' }, { status: 400 });
    }

    const userPasskeys = store.profile.passkeys.map(pk => ({
      id: new Uint8Array(Buffer.from(pk.id, 'base64url')),
      transports: pk.transports,
      type: 'public-key' as const,
    }));

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: userPasskeys,
      userVerification: 'preferred',
    });

    const resp = NextResponse.json(options);
    resp.cookies.set('auth_challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 5,
    });

    return resp;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
