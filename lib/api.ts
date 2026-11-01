import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from './db';
import { SESSION_COOKIE, verifySession, type Session } from './auth';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** The signed-in user, re-checked against the database so removed accounts lose access at once. */
export async function requireUser(role?: 'owner' | 'master'): Promise<Session> {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) throw new HttpError(401, 'Not signed in');
  const [user] = await sql`select id, email, role from users where id = ${session.uid}`;
  if (!user) throw new HttpError(401, 'Account no longer exists');
  if (role === 'owner' && user.role === 'staff') throw new HttpError(403, 'Only an admin can do this');
  if (role === 'master' && user.role !== 'master') throw new HttpError(403, 'Only the master admin can do this');
  return { uid: user.id, email: user.email, role: user.role };
}

/** Wraps a route handler: turns thrown errors into JSON responses. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status });
      console.error(err);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  };
}

/** Rebuilds the cached public menu so guests see a change within seconds. */
export function refreshMenu() {
  revalidatePath('/', 'layout');
}

export const ok = (data: unknown = { ok: true }) => NextResponse.json(data);

export async function body<T = any>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}

const HEX = /^#[0-9a-fA-F]{6}$/;
export const isHex = (v: unknown) => typeof v === 'string' && HEX.test(v);

/** Keeps only fr/ar/en string fields, trimmed and capped. */
export function cleanText(v: unknown, max = 400): Record<string, string> {
  const out: Record<string, string> = {};
  if (v && typeof v === 'object') {
    for (const k of ['fr', 'ar', 'en']) {
      const s = (v as any)[k];
      if (typeof s === 'string') out[k] = s.trim().slice(0, max);
    }
  }
  return out;
}

export function cleanPrice(v: unknown): number | null {
  if (v === null || v === '' || v === undefined) return null;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new HttpError(400, 'Invalid price');
  return n;
}
