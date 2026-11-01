// Creates the tables, loads the starting menu on first run and creates the master admin account.
// Runs before every build and is safe to run again: it never overwrites edits made in the admin.
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import sharp from 'sharp';
import bcrypt from 'bcryptjs';
import { CATEGORIES, SETTINGS } from './seed-data.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  ssl: process.env.DATABASE_SSL === 'true' || /sslmode=require|neon\.tech|supabase\.co/.test(DATABASE_URL) ? 'require' : false,
  max: 1,
  onnotice: () => {},
});

async function storeImage(file, maxWidth) {
  const input = await readFile(path.join(dir, 'seed-images', file));
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
  const id = randomUUID();
  await sql`insert into images (id, data, mime, width, height)
            values (${id}, ${data}, 'image/webp', ${info.width}, ${info.height})`;
  return id;
}

async function main() {
  await sql.unsafe(await readFile(path.join(dir, 'schema.sql'), 'utf8'));
  // Databases created before the master admin role existed: widen the role check.
  await sql.unsafe(`alter table users drop constraint if exists users_role_check;
    alter table users add constraint users_role_check check (role in ('master', 'owner', 'staff'))`);
  console.log('Schema ready.');

  const [{ count }] = await sql`select count(*)::int as count from categories`;
  if (count === 0) {
    let featured = null;
    for (const [ci, cat] of CATEGORIES.entries()) {
      const [row] = await sql`insert into categories (name, note, position)
        values (${sql.json(cat.name)}, ${sql.json(cat.note)}, ${ci}) returning id`;
      for (const [ii, it] of cat.items.entries()) {
        const imageId = it.image ? await storeImage(it.image, 1000) : null;
        const [item] = await sql`insert into items
          (category_id, name, description, price, badges, image_id, position)
          values (${row.id}, ${sql.json(it.name)}, ${sql.json(it.description)}, ${it.price},
                  ${it.badges ?? []}, ${imageId}, ${ii}) returning id`;
        if (it.badges?.includes('chef') && !featured) featured = item.id;
      }
    }
    SETTINGS.branding.logoImageId = await storeImage('logo.png', 900);
    SETTINGS.branding.featuredItemId = featured;
    console.log('Starting menu loaded.');
  }

  for (const [key, value] of Object.entries(SETTINGS)) {
    await sql`insert into settings (key, value) values (${key}, ${sql.json(value)})
              on conflict (key) do nothing`;
  }

  // The account in MASTER_EMAIL (or ADMIN_EMAIL when MASTER_EMAIL is not set) is the master admin:
  // it can edit everything and is the only one who can add, edit and remove admin accounts.
  const email = (process.env.MASTER_EMAIL || process.env.ADMIN_EMAIL)?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const [existing] = email ? await sql`select id, role from users where email = ${email}` : [];
  if (existing) {
    if (existing.role !== 'master') {
      await sql`update users set role = 'master' where id = ${existing.id}`;
      console.log(`${email} is now the master admin.`);
    }
    if (password && process.env.RESET_ADMIN_PASSWORD === 'true') {
      await sql`update users set password_hash = ${await bcrypt.hash(password, 10)} where id = ${existing.id}`;
      await sql`delete from login_attempts`;
      console.log(`Password reset for ${email}. Set RESET_ADMIN_PASSWORD back to false.`);
    }
  } else if (email && password) {
    await sql`insert into users (email, name, password_hash, role)
              values (${email}, 'Master admin', ${await bcrypt.hash(password, 10)}, 'master')`;
    console.log(`Master admin account created for ${email}.`);
  } else {
    const [{ users }] = await sql`select count(*)::int as users from users`;
    if (users === 0) console.warn('No admin account yet: set ADMIN_EMAIL and ADMIN_PASSWORD and run setup again.');
  }
}

main()
  .then(() => sql.end())
  .catch(async (err) => {
    console.error(err);
    await sql.end();
    process.exit(1);
  });
