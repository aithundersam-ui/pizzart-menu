import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { body, handler, HttpError, ok, requireUser } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

/** Owner resets another account's password. */
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireUser('owner');
  const id = Number((await params).id);
  const b = await body(req);
  if (String(b.password ?? '').length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  await sql`update users set password_hash = ${await bcrypt.hash(b.password, 10)} where id = ${id}`;
  return ok();
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const me = await requireUser('owner');
  const id = Number((await params).id);
  if (id === me.uid) throw new HttpError(400, "You can't delete your own account");
  await sql`delete from users where id = ${id}`;
  return ok();
});
