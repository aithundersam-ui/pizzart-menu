import { sql } from '@/lib/db';
import { handler, ok, refreshMenu, requireUser } from '@/lib/api';

export const POST = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireUser('owner');
  const id = Number((await params).id);
  await sql`update items set deleted_at = null,
      position = (select coalesce(max(position), -1) + 1 from items i2 where i2.category_id = items.category_id)
    where id = ${id}`;
  refreshMenu();
  return ok();
});
