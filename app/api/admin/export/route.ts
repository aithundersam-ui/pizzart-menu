import { sql } from '@/lib/db';
import { handler, requireUser } from '@/lib/api';

/** Full backup of the menu and settings as JSON (photos included as base64). */
export const GET = handler(async () => {
  await requireUser('owner');
  const [settings, categories, items, images] = await Promise.all([
    sql`select key, value from settings`,
    sql`select * from categories order by position`,
    sql`select * from items order by category_id, position`,
    sql`select id, mime, width, height, encode(data, 'base64') as data from images`,
  ]);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify({ exportedAt: new Date(), settings, categories, items, images }), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="pizzart-backup-${day}.json"`,
    },
  });
});
