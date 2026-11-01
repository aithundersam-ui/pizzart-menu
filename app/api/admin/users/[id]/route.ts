import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { body, handler, HttpError, ok, requireUser } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };
const ROLES = ['master', 'owner', 'staff'];

async function masterCount() {
  const [{ n }] = await sql`select count(*)::int as n from users where role = 'master'`;
  return n as number;
}

/** Master admin edits an account: name, email, role and/or a new password. */
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const me = await requireUser('master');
  const id = Number((await params).id);
  const [user] = await sql`select id, role from users where id = ${id}`;
  if (!user) throw new HttpError(404, 'Account not found');
  const b = await body(req);

  if (b.email !== undefined) {
    const email = String(b.email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Enter a valid email');
    const [taken] = await sql`select 1 from users where email = ${email} and id <> ${id}`;
    if (taken) throw new HttpError(409, 'This email already has an account');
    await sql`update users set email = ${email} where id = ${id}`;
  }
  if (b.name !== undefined) await sql`update users set name = ${String(b.name).slice(0, 60)} where id = ${id}`;
  if (b.role !== undefined && b.role !== user.role) {
    if (!ROLES.includes(b.role)) throw new HttpError(400, 'Unknown role');
    if (user.role === 'master' && (id === me.uid || (await masterCount()) <= 1)) {
      throw new HttpError(400, 'There must always be a master admin');
    }
    await sql`update users set role = ${b.role} where id = ${id}`;
  }
  if (b.password) {
    if (String(b.password).length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
    await sql`update users set password_hash = ${await bcrypt.hash(b.password, 10)} where id = ${id}`;
  }
  return ok();
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const me = await requireUser('master');
  const id = Number((await params).id);
  if (id === me.uid) throw new HttpError(400, "You can't delete your own account");
  await sql`delete from users where id = ${id}`;
  return ok();
});
