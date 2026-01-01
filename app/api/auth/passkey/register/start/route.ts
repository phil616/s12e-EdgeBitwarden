import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getStore } from '@/lib/kv';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const RP_NAME = process.env.NEXT_PUBLIC_RP_NAME || 'Bitwarden Lite';

export async function GET() {
  try {
    const store = await getStore();
    if (!store || !store.profile) {
      return NextResponse.json({ error: '用户未初始化' }, { status: 400 });
    }

    const userPasskeys = store.profile.passkeys.map((pk) => ({
      id: pk.id,
      transports: pk.transports,
    }));

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: 'YWRtaW4', // Base64URL of "admin"
      userName: 'admin',
      attestationType: 'none',
      excludeCredentials: userPasskeys.map(pk => ({
          id: new Uint8Array(Buffer.from(pk.id, 'base64url')),
          transports: pk.transports,
          type: 'public-key' as const,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform', // Prefer built-in (TouchID/Hello)
      },
    });

    const resp = NextResponse.json(options);
    // Store challenge in httpOnly cookie
    resp.cookies.set('reg_challenge', options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 5, // 5 minutes
    });

    return resp;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
