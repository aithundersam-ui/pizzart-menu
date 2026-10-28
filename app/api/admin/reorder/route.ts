import { sql } from '@/lib/db';
import { body, handler, HttpError, ok, refreshMenu, requireUser } from '@/lib/api';

/** Saves a new order: ids listed top to bottom. */
export const POST = handler(async (req: Request) => {
  await requireUser('owner');
  const { kind, ids } = await body(req);
  if (!Array.isArray(ids) || !ids.every(Number.isInteger)) throw new HttpError(400, 'ids must be a list');
  await sql.begin(async (tx) => {
    for (const [i, id] of ids.entries()) {
      if (kind === 'categories') await tx`update categories set position = ${i} where id = ${id}`;
      else if (kind === 'items') await tx`update items set position = ${i} where id = ${id}`;
      else throw new HttpError(400, 'Unknown kind');
    }
  });
  refreshMenu();
  return ok();
});
