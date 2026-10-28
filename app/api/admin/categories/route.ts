import { sql } from '@/lib/db';
import { body, cleanText, handler, HttpError, ok, refreshMenu, requireUser } from '@/lib/api';

export const POST = handler(async (req: Request) => {
  await requireUser('owner');
  const b = await body(req);
  const name = cleanText(b.name, 80);
  if (!name.fr && !name.ar && !name.en) throw new HttpError(400, 'Give the category a name');
  const [row] = await sql`insert into categories (name, note, position)
    values (${sql.json(name)}, ${sql.json(cleanText(b.note, 160))},
            (select coalesce(max(position), -1) + 1 from categories)) returning id`;
  refreshMenu();
  return ok({ id: row.id });
});
