import { sql } from './db';
import type { Category, Item, MenuData, Settings } from './types';

export function rowToItem(r: any): Item {
  return {
    id: r.id,
    categoryId: r.category_id,
    name: r.name ?? {},
    description: r.description ?? {},
    price: r.price,
    sizes: r.sizes ?? [],
    badges: r.badges ?? [],
    imageId: r.image_id,
    available: r.available,
    visible: r.visible,
    position: r.position,
  };
}

export function rowToCategory(r: any): Category {
  return {
    id: r.id,
    name: r.name ?? {},
    note: r.note ?? {},
    imageId: r.image_id,
    position: r.position,
    visible: r.visible,
  };
}

export async function getSettings(): Promise<Settings> {
  const rows = await sql`select key, value from settings`;
  const out: any = {};
  for (const r of rows) out[r.key] = r.value;
  return out as Settings;
}

/** Everything the public menu needs, hidden and deleted things left out. */
export async function getPublicMenu(): Promise<MenuData> {
  const [settings, cats, items] = await Promise.all([
    getSettings(),
    sql`select * from categories where visible order by position, id`,
    sql`select * from items where visible and deleted_at is null order by position, id`,
  ]);
  const byCat = new Map<number, Item[]>();
  for (const r of items) {
    const it = rowToItem(r);
    byCat.set(it.categoryId, [...(byCat.get(it.categoryId) ?? []), it]);
  }
  return {
    ...settings,
    categories: cats
      .map((c) => ({ ...rowToCategory(c), items: byCat.get(c.id) ?? [] }))
      .filter((c) => c.items.length > 0),
  };
}

/** Everything for the admin menu editor, including hidden items. */
export async function getAdminMenu() {
  const [cats, items, deleted] = await Promise.all([
    sql`select * from categories order by position, id`,
    sql`select * from items where deleted_at is null order by position, id`,
    sql`select * from items where deleted_at is not null order by deleted_at desc limit 50`,
  ]);
  return {
    categories: cats.map((c) => ({
      ...rowToCategory(c),
      items: items.filter((i) => i.category_id === c.id).map(rowToItem),
    })),
    deleted: deleted.map(rowToItem),
  };
}
