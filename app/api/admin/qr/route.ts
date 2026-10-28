import QRCode from 'qrcode';
import sharp from 'sharp';
import { sql } from '@/lib/db';
import { getSettings } from '@/lib/data';
import { handler, requireUser } from '@/lib/api';

/** The address printed in the QR codes: short and permanent, with an optional table number. */
function menuUrl(origin: string, table: string) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, '');
  return `${base}/m${table ? `?t=${encodeURIComponent(table)}` : ''}`;
}

async function logoPng(): Promise<{ data: string; w: number; h: number } | null> {
  const { branding } = await getSettings();
  if (!branding.logoImageId) return null;
  const [img] = await sql`select data from images where id = ${branding.logoImageId}`;
  if (!img) return null;
  const { data, info } = await sharp(img.data).resize({ width: 360 }).png({ palette: true }).toBuffer({ resolveWithObject: true });
  return { data: data.toString('base64'), w: info.width, h: info.height };
}

/** QR code SVG with the logo on a white plate in the middle (high error correction keeps it scannable). */
async function qrSvg(url: string, dark: string) {
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size;
  const margin = 3;
  const total = n + margin * 2;
  let path = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) if (qr.modules.get(x, y)) path += `M${x + margin} ${y + margin}h1v1h-1z`;
  }
  let center = '';
  const logo = await logoPng();
  if (logo) {
    const plateW = total * 0.34;
    const plateH = Math.min(total * 0.2, plateW * (logo.h / logo.w) + total * 0.06);
    const px = (total - plateW) / 2;
    const py = (total - plateH) / 2;
    const pad = total * 0.025;
    center = `<rect x="${px}" y="${py}" width="${plateW}" height="${plateH}" rx="${total * 0.03}" fill="#fff"/>` +
      `<image x="${px + pad}" y="${py + pad}" width="${plateW - pad * 2}" height="${plateH - pad * 2}" ` +
      `preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${logo.data}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
    `<rect width="${total}" height="${total}" fill="#fff"/><path d="${path}" fill="${dark}"/>${center}</svg>`;
}

export const GET = handler(async (req: Request) => {
  await requireUser();
  const u = new URL(req.url);
  const table = (u.searchParams.get('table') ?? '').replace(/[^\w-]/g, '').slice(0, 12);
  const format = u.searchParams.get('format') === 'png' ? 'png' : 'svg';
  const url = menuUrl(u.origin, table);
  const svg = await qrSvg(url, '#1d1411');
  const name = `pizzart-qr${table ? `-table-${table}` : ''}`;
  const download = u.searchParams.get('download') === '1';
  const headers: Record<string, string> = { 'Cache-Control': 'no-store', 'X-Menu-Url': url };
  if (download) headers['Content-Disposition'] = `attachment; filename="${name}.${format}"`;
  if (format === 'svg') return new Response(svg, { headers: { ...headers, 'Content-Type': 'image/svg+xml' } });
  const png = await sharp(Buffer.from(svg), { density: 600 }).resize(2000, 2000).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { ...headers, 'Content-Type': 'image/png' } });
});
