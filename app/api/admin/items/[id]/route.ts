import { sql } from '@/lib/db';
import { body, cleanPrice, handler, HttpError, ok, refreshMenu, requireUser } from '@/lib/api';
import { itemFields } from '../fields';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const id = Number((await params).id);
  const b = await body(req);
  const [cur] = await sql`select * from items where id = ${id}`;
  if (!cur) throw new HttpError(404, 'Dish not found');

  if (user.role === 'staff') {
    // Staff can only mark dishes sold out / back in stock and change prices.
    const allowed = ['available', 'price', 'sizes'];
    if (Object.keys(b).some((k) => !allowed.includes(k))) throw new HttpError(403, 'Only the owner can do this');
    const sizes = Array.isArray(b.sizes)
      ? b.sizes.map((s: any, i: number) => ({ label: cur.sizes[i]?.label ?? {}, price: cleanPrice(s?.price) }))
      : cur.sizes;
    await sql`update items set
        available = ${'available' in b ? Boolean(b.available) : cur.available},
        price = ${'price' in b ? cleanPrice(b.price) : cur.price},
        sizes = ${sql.json(sizes)}, updated_at = now()
      where id = ${id}`;
  } else {
    const f = itemFields({
      categoryId: cur.category_id, name: cur.name, description: cur.description, price: cur.price,
      sizes: cur.sizes, badges: cur.badges, imageId: cur.image_id, available: cur.available, visible: cur.visible,
      ...b,
    });
    await sql`update items set
        category_id = ${f.categoryId ?? cur.category_id}, name = ${sql.json(f.name)},
        description = ${sql.json(f.description)}, price = ${f.price}, sizes = ${sql.json(f.sizes)},
        badges = ${f.badges}, image_id = ${f.imageId}, available = ${f.available}, visible = ${f.visible},
        updated_at = now()
      where id = ${id}`;
  }
  refreshMenu();
  return ok();
});

/** Moves the dish to the bin; it can be restored from the menu page. */
export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireUser('owner');
  const id = Number((await params).id);
  await sql`update items set deleted_at = now() where id = ${id}`;
  refreshMenu();
  return ok();
});
