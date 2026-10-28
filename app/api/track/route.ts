import { sql } from '@/lib/db';

// Anonymous counters: QR scans per day/table and dish openings. No personal data is stored.
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });
    if (b.type === 'scan') {
      const table = typeof b.table === 'string' ? b.table.replace(/[^\w-]/g, '').slice(0, 12) : '';
      await sql`insert into scans (day, table_label, count) values (${day}, ${table}, 1)
                on conflict (day, table_label) do update set count = scans.count + 1`;
    } else if (b.type === 'item' && Number.isInteger(b.id)) {
      await sql`insert into item_views (day, item_id, count)
                select ${day}, id, 1 from items where id = ${b.id}
                on conflict (day, item_id) do update set count = item_views.count + 1`;
    }
  } catch {
    // Counting must never break the menu.
  }
  return new Response(null, { status: 204 });
}
