# PizzArt menu

QR-code menu website and admin panel for **PizzArt**, Draria (Algiers).

- **Guests** scan the QR code on the table and get the menu on their phone: French, Arabic (right-to-left) and English, prices in DA, search, dish photos, opening hours, call and directions buttons.
- **The owner** signs in at `/admin` and edits everything: dishes, prices, sizes, photos, badges, sold-out status, categories and their order, restaurant info and hours, logo, colours, fonts, languages, the fixed words on the menu, staff accounts, and prints the QR codes.
- **Staff accounts** can only mark dishes sold out and change prices.

Built with Next.js 15 and any standard Postgres database. Photos are stored in the database (resized to small WebP files), so the only service needed besides hosting is Postgres.

## Deploy on Netlify

1. **Create the database.** Sign up at [neon.tech](https://neon.tech) (free plan), create a project in the **AWS Europe (Frankfurt)** region (closest to Algiers), and copy the connection string (it starts with `postgresql://` and ends with `?sslmode=require`).
2. **Create the site.** In Netlify: *Add new site → Import an existing project → GitHub* and pick `pizzart-menu`. Netlify detects Next.js; keep the build settings it proposes (they come from `netlify.toml`).
3. **Add the environment variables** (*Site configuration → Environment variables*) before the first deploy:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | the Neon connection string |
   | `AUTH_SECRET` | a long random string, 40+ characters (signs the admin login) |
   | `ADMIN_EMAIL` | the owner's email, used to sign in |
   | `ADMIN_PASSWORD` | the owner's first password (change it later in Admin → Accounts) |
   | `NEXT_PUBLIC_SITE_URL` | the site address, e.g. `https://pizzart-draria.netlify.app` or your own domain |

4. **Deploy.** The first build creates the tables, loads the current menu and creates the owner account. Then open `/admin` and sign in.
5. **Own domain (optional).** *Domain management → Add a domain*. Update `NEXT_PUBLIC_SITE_URL` and redeploy **before printing QR codes**, because the codes contain this address.

If you use Netlify DB instead of Neon, `NETLIFY_DATABASE_URL` is picked up automatically and `DATABASE_URL` can be left out.

### Forgot the owner password

Set `RESET_ADMIN_PASSWORD=true` and a new `ADMIN_PASSWORD` in Netlify, trigger a redeploy, sign in, then set `RESET_ADMIN_PASSWORD` back to `false`.

## Run locally

```bash
cp .env.example .env      # fill in DATABASE_URL etc.
npm install
npm run setup             # tables, starting menu, owner account
npm run dev               # http://localhost:3000 and /admin
```

## How it fits together

| Path | What it is |
| --- | --- |
| `/` | Public menu (pre-rendered; rebuilt within seconds after each admin save) |
| `/m?t=5` | Short address printed in the QR codes; counts the scan and opens the menu |
| `/admin` | Admin panel (login required) |
| `scripts/setup.mjs` | Creates tables, loads `scripts/seed-data.mjs` on an empty database, creates the owner |
| `app/api/admin/*` | Admin API, every route checks the signed-in user and role |

The starting menu was typed from the printed menu (October 2026); the starting photos and logo were cut from photos of the shop signs and should be replaced with real dish photos and the original logo file from Admin.

Backups: Admin → Accounts → *Download backup* exports the whole menu, settings and photos as one JSON file. Neon also keeps its own point-in-time history.
