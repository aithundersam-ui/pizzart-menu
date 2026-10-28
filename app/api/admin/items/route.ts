import { sql } from '@/lib/db';
import { body, handler, HttpError, ok, refreshMenu, requireUser } from '@/lib/api';
import { itemFields } from './fields';

export const POST = handler(async (req: Request) => {
  await requireUser('owner');
  const f = itemFields(await body(req));
  if (!f.categoryId) throw new HttpError(400, 'Choose a category');
  if (!f.name.fr && !f.name.ar && !f.name.en) throw new HttpError(400, 'Give the dish a name');
  const [row] = await sql`insert into items
      (category_id, name, description, price, sizes, badges, image_id, available, visible, position)
    values (${f.categoryId}, ${sql.json(f.name)}, ${sql.json(f.description)}, ${f.price}, ${sql.json(f.sizes)},
            ${f.badges}, ${f.imageId}, ${f.available}, ${f.visible},
            (select coalesce(max(position), -1) + 1 from items where category_id = ${f.categoryId}))
    returning id`;
  refreshMenu();
  return ok({ id: row.id });
});
