import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getStore, updateStore } from '@/lib/kv';
import { cookies } from 'next/headers';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || (process.env.NODE_ENV === 'production' ? `https://${RP_ID}` : `http://${RP_ID}:3000`);

import { unwrapKey } from '@/lib/server-crypto';

// ... (imports)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get('auth_challenge')?.value;

    if (!expectedChallenge) {
      return NextResponse.json({ error: '挑战已过期 (Challenge expired)' }, { status: 400 });
    }

    const store = await getStore();
    if (!store || !store.profile) {
      return NextResponse.json({ error: '用户未找到' }, { status: 404 });
    }

    const passkey = store.profile.passkeys.find(pk => pk.id === body.id);
    if (!passkey) {
      return NextResponse.json({ error: '通行密钥未注册' }, { status: 400 });
    }

    const pubKeyBuffer = new Uint8Array(Buffer.from(passkey.publicKey, 'base64url')); 
    const credentialIDUint8 = new Uint8Array(Buffer.from(passkey.id, 'base64url'));

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: credentialIDUint8,
        credentialPublicKey: pubKeyBuffer,
        counter: passkey.counter,
        transports: passkey.transports,
      },
    });

    if (verification.verified && verification.authenticationInfo) {
      // Update counter
      passkey.counter = verification.authenticationInfo.newCounter;
      await updateStore(store);

      let masterKey: string | undefined = undefined;
      if (store.profile.wrappedMasterKey) {
          try {
              masterKey = unwrapKey(store.profile.wrappedMasterKey);
          } catch (e) {
              console.error('Failed to unwrap key', e);
          }
      }

      const resp = NextResponse.json({ 
          verified: true, 
          vault: store.vault,
          masterKey, // Return the unwrapped master key (JWK string)
      }); 
      resp.cookies.delete('auth_challenge');
      return resp;
    }

    return NextResponse.json({ verified: false, error: '验证失败' }, { status: 401 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
