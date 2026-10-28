import { sql } from '@/lib/db';
import { handler, HttpError, ok, refreshMenu, requireUser } from '@/lib/api';

export const POST = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireUser('owner');
  const id = Number((await params).id);
  const [cur] = await sql`select * from items where id = ${id}`;
  if (!cur) throw new HttpError(404, 'Dish not found');
  const name: Record<string, string> = Object.fromEntries(Object.entries(cur.name as Record<string, string>).map(([k, v]) => [k, v ? `${v} (copie)` : v]));
  await sql`update items set position = position + 1 where category_id = ${cur.category_id} and position > ${cur.position}`;
  const [row] = await sql`insert into items
      (category_id, name, description, price, sizes, badges, image_id, available, visible, position)
    values (${cur.category_id}, ${sql.json(name)}, ${sql.json(cur.description)}, ${cur.price}, ${sql.json(cur.sizes)},
            ${cur.badges}, ${cur.image_id}, ${cur.available}, false, ${cur.position + 1})
    returning id`;
  refreshMenu();
  return ok({ id: row.id });
});
