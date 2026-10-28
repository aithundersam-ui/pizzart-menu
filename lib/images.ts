import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { sql } from './db';

const MAX_BYTES = 15 * 1024 * 1024;

/** Resizes and compresses an upload to WebP and stores it. Returns the new image id. */
export async function saveImage(file: File, maxWidth = 1200): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error('Image is larger than 15 MB');
  const input = Buffer.from(await file.arrayBuffer());
  const { data, info } = await sharp(input, { failOn: 'error' })
    .rotate()
    .resize({ width: maxWidth, height: maxWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer({ resolveWithObject: true });
  const id = randomUUID();
  await sql`insert into images (id, data, mime, width, height)
            values (${id}, ${data}, 'image/webp', ${info.width}, ${info.height})`;
  return id;
}
