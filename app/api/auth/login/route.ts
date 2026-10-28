import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sessionCookie, signSession } from '@/lib/auth';
import { body, handler, HttpError } from '@/lib/api';

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

export const POST = handler(async (req: Request) => {
  const { email, password } = await body(req);
  if (typeof email !== 'string' || typeof password !== 'string') throw new HttpError(400, 'Email and password required');
  const key = email.trim().toLowerCase();

  const [attempt] = await sql`select fails, locked_until from login_attempts where key = ${key}`;
  if (attempt?.locked_until && new Date(attempt.locked_until) > new Date()) {
    throw new HttpError(429, `Too many wrong passwords. Try again in ${LOCK_MINUTES} minutes.`);
  }

  const [user] = await sql`select id, email, role, password_hash from users where email = ${key}`;
  const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!valid) {
    await sql`insert into login_attempts (key, fails) values (${key}, 1)
      on conflict (key) do update set
        fails = case when login_attempts.locked_until < now() then 1 else login_attempts.fails + 1 end,
        locked_until = case
          when (case when login_attempts.locked_until < now() then 1 else login_attempts.fails + 1 end) >= ${MAX_FAILS}
          then now() + ${LOCK_MINUTES + ' minutes'}::interval else null end`;
    throw new HttpError(401, 'Wrong email or password');
  }

  await sql`delete from login_attempts where key = ${key}`;
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(sessionCookie(await signSession({ uid: user.id, email: user.email, role: user.role })));
  return res;
});
