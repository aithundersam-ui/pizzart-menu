import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { body, handler, HttpError, ok, requireUser } from '@/lib/api';

export const POST = handler(async (req: Request) => {
  const me = await requireUser();
  const { current, next } = await body(req);
  const [u] = await sql`select password_hash from users where id = ${me.uid}`;
  if (!(await bcrypt.compare(String(current ?? ''), u.password_hash))) throw new HttpError(400, 'Current password is wrong');
  if (String(next ?? '').length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
  await sql`update users set password_hash = ${await bcrypt.hash(next, 10)} where id = ${me.uid}`;
  return ok();
});
