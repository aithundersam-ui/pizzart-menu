import { sql } from '@/lib/db';
import { body, cleanText, handler, HttpError, ok, refreshMenu, requireUser } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireUser('owner');
  const id = Number((await params).id);
  const b = await body(req);
  const [cur] = await sql`select * from categories where id = ${id}`;
  if (!cur) throw new HttpError(404, 'Category not found');
  await sql`update categories set
      name = ${sql.json('name' in b ? cleanText(b.name, 80) : cur.name)},
      note = ${sql.json('note' in b ? cleanText(b.note, 160) : cur.note)},
      visible = ${'visible' in b ? Boolean(b.visible) : cur.visible},
      image_id = ${'imageId' in b ? b.imageId || null : cur.image_id}
    where id = ${id}`;
  refreshMenu();
  return ok();
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireUser('owner');
  const id = Number((await params).id);
  const [{ n }] = await sql`select count(*)::int as n from items where category_id = ${id} and deleted_at is null`;
  if (n > 0) throw new HttpError(409, 'Move or delete the dishes in this category first');
  await sql`delete from categories where id = ${id}`;
  refreshMenu();
  return ok();
});
