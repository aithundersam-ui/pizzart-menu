import { sql } from '@/lib/db';

const UUID = /^[0-9a-f-]{36}$/;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response('Not found', { status: 404 });
  const [img] = await sql`select data, mime from images where id = ${id}`;
  if (!img) return new Response('Not found', { status: 404 });
  // Image ids never change content, so phones and the CDN can keep them for a year.
  return new Response(new Uint8Array(img.data), {
    headers: { 'Content-Type': img.mime, 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
}
