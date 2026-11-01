-- PizzArt menu schema. Safe to run repeatedly.

create table if not exists images (
  id uuid primary key,
  data bytea not null,
  mime text not null,
  width int not null,
  height int not null,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id serial primary key,
  name jsonb not null,               -- {"fr": "...", "ar": "...", "en": "..."}
  note jsonb not null default '{}',  -- short line under the category title
  image_id uuid references images(id) on delete set null,
  position int not null default 0,
  visible boolean not null default true
);

create table if not exists items (
  id serial primary key,
  category_id int not null references categories(id) on delete cascade,
  name jsonb not null,
  description jsonb not null default '{}',
  price int,                         -- whole dinars; null when sizes are used
  sizes jsonb not null default '[]', -- [{"label": {"fr": "..."}, "price": 900}]
  badges text[] not null default '{}',
  image_id uuid references images(id) on delete set null,
  available boolean not null default true,  -- false = sold out today
  visible boolean not null default true,
  position int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists items_category_idx on items (category_id, position);

create table if not exists users (
  id serial primary key,
  email text not null unique,
  name text not null default '',
  password_hash text not null,
  role text not null check (role in ('master', 'owner', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists login_attempts (
  key text primary key,
  fails int not null default 0,
  locked_until timestamptz
);

create table if not exists scans (
  day date not null,
  table_label text not null default '',
  count int not null default 0,
  primary key (day, table_label)
);

create table if not exists item_views (
  day date not null,
  item_id int not null references items(id) on delete cascade,
  count int not null default 0,
  primary key (day, item_id)
);
