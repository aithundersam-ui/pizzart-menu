import { sql } from '@/lib/db';
import { handler, ok, requireUser } from '@/lib/api';

export const GET = handler(async () => {
  await requireUser();
  const [days, tables, dishes, counts] = await Promise.all([
    sql`select to_char(d, 'YYYY-MM-DD') as day, coalesce(sum(s.count), 0)::int as scans
        from generate_series((now() at time zone 'Africa/Algiers')::date - 13,
                             (now() at time zone 'Africa/Algiers')::date, '1 day') d
        left join scans s on s.day = d::date group by d order by d`,
    sql`select table_label, sum(count)::int as scans from scans
        where day > current_date - 30 and table_label <> '' group by 1 order by 2 desc limit 10`,
    sql`select i.id, i.name, sum(v.count)::int as views from item_views v join items i on i.id = v.item_id
        where v.day > current_date - 30 group by i.id order by views desc limit 8`,
    sql`select (select count(*) from items where deleted_at is null)::int as dishes,
               (select count(*) from items where deleted_at is null and not available)::int as sold_out,
               (select count(*) from items where deleted_at is null and not visible)::int as hidden,
               (select count(*) from categories)::int as categories`,
  ]);
  return ok({ days, tables, dishes, counts: counts[0] });
});
