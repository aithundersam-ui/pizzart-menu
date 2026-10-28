import { sql } from '@/lib/db';
import { body, cleanText, handler, HttpError, isHex, ok, refreshMenu, requireUser } from '@/lib/api';
import { LANGS, type Lang } from '@/lib/types';
import { LABELS } from '@/lib/i18n';

type Ctx = { params: Promise<{ key: string }> };
const KEYS = ['restaurant', 'branding', 'languages'];

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const time = (v: unknown) => (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v) ? v : '00:00');

function clean(key: string, b: any) {
  if (key === 'restaurant') {
    return {
      name: str(b.name, 60) || 'PizzArt',
      slogan: cleanText(b.slogan, 120),
      address: cleanText(b.address, 200),
      mapsUrl: /^https:\/\//.test(str(b.mapsUrl, 500)) ? str(b.mapsUrl, 500) : '',
      phone: str(b.phone, 30),
      whatsapp: str(b.whatsapp, 30),
      instagram: str(b.instagram, 60).replace(/^@/, ''),
      facebook: str(b.facebook, 120),
      tiktok: str(b.tiktok, 60).replace(/^@/, ''),
      delivery: cleanText(b.delivery, 120),
      announcement: cleanText(b.announcement, 240),
      hours: [0, 1, 2, 3, 4, 5, 6].map((day) => {
        const h = Array.isArray(b.hours) ? b.hours.find((x: any) => x?.day === day) : null;
        return { day, open: time(h?.open), close: time(h?.close), closed: Boolean(h?.closed) };
      }),
    };
  }
  if (key === 'branding') {
    for (const c of ['primary', 'accent', 'background', 'text']) {
      if (!isHex(b[c])) throw new HttpError(400, `Invalid colour for ${c}`);
    }
    return {
      primary: b.primary, accent: b.accent, background: b.background, text: b.text,
      font: ['classic', 'modern', 'street'].includes(b.font) ? b.font : 'classic',
      logoImageId: str(b.logoImageId, 36) || null,
      coverImageId: str(b.coverImageId, 36) || null,
      featuredItemId: Number.isInteger(b.featuredItemId) ? b.featuredItemId : null,
    };
  }
  // languages
  const enabled = (Array.isArray(b.enabled) ? b.enabled : []).filter((l: Lang) => LANGS.includes(l));
  if (enabled.length === 0) throw new HttpError(400, 'Keep at least one language');
  const labels: Record<string, Record<string, string>> = {};
  for (const l of LANGS) {
    labels[l] = {};
    for (const k of Object.keys(LABELS)) {
      const v = str(b.labels?.[l]?.[k], 80);
      if (v) labels[l][k] = v;
    }
  }
  return { enabled, default: enabled.includes(b.default) ? b.default : enabled[0], labels };
}

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requireUser();
  const { key } = await params;
  const [row] = await sql`select value from settings where key = ${key}`;
  if (!row) throw new HttpError(404, 'Unknown setting');
  return ok(row.value);
});

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireUser('owner');
  const { key } = await params;
  if (!KEYS.includes(key)) throw new HttpError(404, 'Unknown setting');
  const value = clean(key, await body(req));
  await sql`insert into settings (key, value) values (${key}, ${sql.json(value)})
            on conflict (key) do update set value = excluded.value, updated_at = now()`;
  refreshMenu();
  return ok(value);
});
