-- Jalankan di Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('expense', 'income')),
  color text not null default '#64748b',
  unique (name, type)
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  amount numeric(14, 2) not null check (amount > 0),
  type text not null check (type in ('expense', 'income')),
  category_id uuid not null references categories(id) on delete restrict,
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_occurred_on_idx on transactions (occurred_on desc);
create index if not exists transactions_category_idx on transactions (category_id);

-- Satu batas bulanan per kategori pengeluaran, berlaku tiap bulan.
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null unique references categories(id) on delete cascade,
  monthly_limit numeric(14, 2) not null check (monthly_limit > 0),
  created_at timestamptz not null default now()
);

-- Mencegah alert Telegram dobel untuk kategori + bulan + level yang sama.
create table if not exists alert_log (
  category_id uuid not null references categories(id) on delete cascade,
  month date not null,
  level int not null check (level in (80, 100)),
  sent_at timestamptz not null default now(),
  primary key (category_id, month, level)
);

-- Target tabungan (halaman Rencana).
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  saved_amount numeric(14, 2) not null default 0 check (saved_amount >= 0),
  target_date date,
  created_at timestamptz not null default now()
);

-- Akses hanya lewat service role key dari server; tanpa policy = anon ditolak.
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table alert_log enable row level security;
alter table goals enable row level security;

insert into categories (name, type, color) values
  ('Makanan', 'expense', '#1d4ed8'),
  ('Transportasi', 'expense', '#3b82f6'),
  ('Tagihan', 'expense', '#0ea5e9'),
  ('Belanja', 'expense', '#6366f1'),
  ('Lain-lain', 'expense', '#94a3b8'),
  ('Gaji', 'income', '#2563eb'),
  ('Bonus', 'income', '#38bdf8'),
  ('Lainnya', 'income', '#60a5fa')
on conflict do nothing;
