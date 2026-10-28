import postgres from 'postgres';

declare global {
  // eslint-disable-next-line no-var
  var __pizzartSql: ReturnType<typeof postgres> | undefined;
}

/** DATABASE_URL, or the variable Netlify DB sets automatically. */
export const DATABASE_URL = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || '';

export function useSsl(url: string) {
  return process.env.DATABASE_SSL === 'true' || /sslmode=require|neon\.tech|supabase\.co/.test(url);
}

// One pool per server process; reused across hot reloads in development.
export const sql =
  globalThis.__pizzartSql ??
  postgres(DATABASE_URL, {
    ssl: useSsl(DATABASE_URL) ? 'require' : false,
    max: 5,
    idle_timeout: 20,
    prepare: false, // works behind Supabase/Neon connection poolers
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== 'production') globalThis.__pizzartSql = sql;
