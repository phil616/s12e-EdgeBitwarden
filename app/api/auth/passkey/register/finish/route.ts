import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getStore, updateStore } from '@/lib/kv';
import { cookies } from 'next/headers';
import { StoredPasskey } from '@/lib/types';

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || (process.env.NODE_ENV === 'production' ? `https://${RP_ID}` : `http://${RP_ID}:3000`);

import { wrapKey } from '@/lib/server-crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { attResp, masterKey } = body; // Expect masterKey (JWK JSON string) here
    
    // Support previous simple format (body IS attResp) or new format { attResp, masterKey }
    const actualAttResp = attResp || body;
    
    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get('reg_challenge')?.value;

    if (!expectedChallenge) {
      return NextResponse.json({ error: '挑战已过期 (Challenge expired)' }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response: actualAttResp,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      const store = await getStore();
      if (!store || !store.profile) {
        return NextResponse.json({ error: '存储未找到 (Store not found)' }, { status: 404 });
      }

      const idBase64 = Buffer.from(credentialID).toString('base64url');
      const publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64url');

      const newPasskey: StoredPasskey = {
        id: idBase64,
        publicKey: publicKeyBase64,
        counter,
        transports: actualAttResp.response.transports,
        created: Date.now(),
      };

      store.profile.passkeys.push(newPasskey);
      
      // If client provided masterKey, wrap and store it
      if (masterKey) {
          // masterKey is expected to be a string (JWK exported)
          const wrapped = wrapKey(masterKey);
          store.profile.wrappedMasterKey = wrapped;
      }
      
      await updateStore(store);

      const resp = NextResponse.json({ verified: true });
      resp.cookies.delete('reg_challenge');
      return resp;
    }

    return NextResponse.json({ verified: false, error: '验证失败' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
