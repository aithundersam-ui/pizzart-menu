import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { body, handler, HttpError, ok, requireUser } from '@/lib/api';

const ROLES = ['master', 'owner', 'staff'] as const;

export const GET = handler(async () => {
  await requireUser('master');
  return ok(await sql`select id, email, name, role, created_at from users order by id`);
});

/** Only the master admin adds accounts. */
export const POST = handler(async (req: Request) => {
  await requireUser('master');
  const b = await body(req);
  const email = String(b.email ?? '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Enter a valid email');
  if (String(b.password ?? '').length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  const role = (ROLES as readonly string[]).includes(b.role) ? b.role : 'staff';
  const [exists] = await sql`select 1 from users where email = ${email}`;
  if (exists) throw new HttpError(409, 'This email already has an account');
  await sql`insert into users (email, name, password_hash, role)
            values (${email}, ${String(b.name ?? '').slice(0, 60)}, ${await bcrypt.hash(b.password, 10)}, ${role})`;
  return ok();
});
