import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'pizzart_session';
const SESSION_HOURS = 24 * 14;

export type Session = { uid: number; email: string; role: 'owner' | 'staff' };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_SECRET must be set to a long random string');
  return new TextEncoder().encode(s);
}

export async function signSession(s: Session): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: Number(payload.uid), email: String(payload.email), role: payload.role as Session['role'] };
  } catch {
    return null;
  }
}

export const sessionCookie = (token: string) => ({
  name: SESSION_COOKIE,
  value: token,
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_HOURS * 3600,
});
