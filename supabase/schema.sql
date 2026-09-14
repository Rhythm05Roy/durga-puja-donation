-- 🪔 ভূরভুষিকালী সার্বজনীন শ্রীশ্রী দূর্গা মন্দির — প্রণামি সংগ্রহ
-- Supabase SQL Editor-এ পুরোটা paste করে Run করুন।
-- আবার চালালেও নিরাপদ (idempotent) — পুরনো ডেটা মুছবে না।
-- পুরনো স্কিমা থেকে আপডেট করলেও এটাই চালান — সব নতুন কলাম/ফাংশন যোগ হবে।

-- ═══ ১. অনলাইন প্রণামি ফরম ═══
create table if not exists public_donations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  present_address text not null,
  permanent_address text,
  medicine_amount integer not null default 0,
  donate_geeta boolean not null default false,
  geeta_qty integer not null default 0,
  donate_tree boolean not null default false,
  tree_qty integer not null default 0,
  donate_cloth boolean not null default false,
  cloth_qty integer not null default 0,
  total_amount integer not null default 0,
  payment_medium text not null,
  sender_phone text not null,
  transaction_id text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- ═══ ২. মাঠ পর্যায়ের সংগ্রহ (পৃথক টেবিল) ═══
create table if not exists field_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  present_address text not null,
  donation_amount integer not null,
  collector text,
  collector_name text,
  collector_username text,
  collection_date date not null default current_date,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- পুরনো ইনস্টলে নতুন কলাম যোগ
alter table field_collections add column if not exists collector_name text;
alter table field_collections add column if not exists collector_username text;
alter table field_collections add column if not exists collection_date date not null default current_date;

-- যাচাই তথ্য: কে যাচাই করেছেন ও কখন
alter table public_donations add column if not exists verified_by text;
alter table public_donations add column if not exists verified_at timestamptz;
alter table field_collections add column if not exists verified_by text;
alter table field_collections add column if not exists verified_at timestamptz;

-- ═══ যাচাই লগ (কোন অ্যাডমিন কোন প্রণামি যাচাই/অযাচাই করেছেন) ═══
create table if not exists verification_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  record_name text not null,
  amount integer not null default 0,
  action text not null check (action in ('verified', 'unverified')),
  admin_username text not null,
  admin_name text not null,
  created_at timestamptz not null default now()
);
alter table verification_logs enable row level security;

-- ═══ ইউজার লগ (কোন অ্যাডমিন কোন সাব-অ্যাডমিন/সংগ্রাহক তৈরি/মুছেছেন) ═══
create table if not exists user_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('created', 'deleted')),
  role text not null,
  username text not null,
  name text not null,
  phone text,
  admin_username text not null,
  admin_name text not null,
  created_at timestamptz not null default now()
);
alter table user_logs enable row level security;

-- ═══ ৩. ইউজার (সাব-অ্যাডমিন + সংগ্রাহক) ═══
-- প্রধান অ্যাডমিন .env-এ fixed; এখানে শুধু তার তৈরি করা ইউজাররা থাকে।
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('subadmin', 'collector')),
  name text not null,
  address text not null,
  phone text,
  created_by text,
  created_at timestamptz not null default now()
);

alter table app_users add column if not exists phone text;

-- ═══ RLS ═══
alter table public_donations enable row level security;
alter table field_collections enable row level security;
alter table app_users enable row level security;

-- প্রণামি ফরম: সবাই জমা দিতে পারবে (INSERT open)
drop policy if exists "anyone can insert online" on public_donations;
create policy "anyone can insert online"
  on public_donations for insert to anon, authenticated with check (true);

drop policy if exists "anyone can insert field" on field_collections;
create policy "anyone can insert field"
  on field_collections for insert to anon, authenticated with check (true);

-- পড়া: অ্যাডমিন প্যানেল থেকে
drop policy if exists "anon can read online" on public_donations;
create policy "anon can read online"
  on public_donations for select to anon, authenticated using (true);

drop policy if exists "anon can read field" on field_collections;
create policy "anon can read field"
  on field_collections for select to anon, authenticated using (true);

-- app_users: কোনো সরাসরি পলিসি নেই — সব কাজ নিচের RPC দিয়ে
-- (পাসওয়ার্ড হ্যাশ বাইরে যাবে না, ইউজার তৈরি/মুছাও RPC ছাড়া অসম্ভব)
drop policy if exists "anon insert users" on app_users;
drop policy if exists "anon delete users" on app_users;
drop policy if exists "anon can read users" on app_users;

-- ═══ পুরনো ফাংশন ভার্সন সরানো ═══
-- (রিটার্ন টাইপ/সিগনেচার বদলালে CREATE OR REPLACE কাজ করে না —
--  ERROR 42P13 এড়াতে আগে পুরনোগুলো drop করা হয়)
drop function if exists public.app_login(text, text);
drop function if exists public.app_list_users();
drop function if exists public.app_create_user(text, text, text, text, text, text);
drop function if exists public.app_create_user(text, text, text, text, text, text, text);
drop function if exists public.app_create_user(text, text, text, text, text, text, text, text);
drop function if exists public.app_delete_user(text);
drop function if exists public.app_delete_user(text, text, text);
drop function if exists public.app_set_verified(text, uuid, boolean);
drop function if exists public.app_set_verified(text, uuid, boolean, text, text);
drop function if exists public.app_list_logs();
drop function if exists public.app_list_user_logs();

-- ═══ RPC: লগইন (পাসওয়ার্ড হ্যাশ গোপন থাকে) ═══
create or replace function public.app_login(p_username text, p_password text)
returns table (username text, role text, name text, address text)
language sql
security definer
set search_path = public
as $$
  select u.username, u.role, u.name, u.address
  from app_users u
  where u.username = lower(p_username)
    and u.password_hash = encode(sha256(convert_to(u.username || ':' || p_password, 'UTF8')), 'hex')
  limit 1;
$$;

-- ═══ RPC: ইউজার তালিকা (হ্যাশ ছাড়া) ═══
create or replace function public.app_list_users()
returns table (id uuid, username text, role text, name text, address text, phone text, created_by text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select id, username, role, name, address, phone, created_by, created_at
  from app_users
  order by created_at desc;
$$;

-- ═══ RPC: নতুন ইউজার তৈরি (সার্ভারেই হ্যাশ হয়, লগসহ) ═══
create or replace function public.app_create_user(
  p_username text, p_password text, p_role text, p_name text, p_address text,
  p_phone text, p_created_by text, p_admin_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('subadmin', 'collector') then
    raise exception 'ভুল ভূমিকা: %', p_role;
  end if;
  if p_username !~ '^[a-zA-Z0-9_]{3,20}$' then
    raise exception 'ইউজার আইডি ৩-২০ অক্ষরের হতে হবে (ইংরেজি অক্ষর/সংখ্যা/আন্ডারস্কোর)';
  end if;
  if length(p_password) < 4 then
    raise exception 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে';
  end if;
  if p_phone is not null and p_phone <> '' and p_phone !~ '^01[0-9]{9}$' then
    raise exception 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)';
  end if;
  insert into app_users (username, password_hash, role, name, address, phone, created_by)
  values (
    lower(p_username),
    encode(sha256(convert_to(lower(p_username) || ':' || p_password, 'UTF8')), 'hex'),
    p_role, p_name, p_address, nullif(p_phone, ''), p_created_by
  );
  insert into user_logs (action, role, username, name, phone, admin_username, admin_name)
  values ('created', p_role, lower(p_username), p_name, nullif(p_phone, ''),
          p_created_by, coalesce(p_admin_name, p_created_by));
end;
$$;

-- ═══ RPC: ইউজার মুছে ফেলা (লগসহ) ═══
create or replace function public.app_delete_user(p_username text, p_admin_username text, p_admin_name text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
  v_name text;
  v_role text;
  v_phone text;
begin
  select name, role, phone into v_name, v_role, v_phone from app_users where username = lower(p_username);
  delete from app_users where username = lower(p_username);
  get diagnostics n = row_count;
  if n > 0 then
    insert into user_logs (action, role, username, name, phone, admin_username, admin_name)
    values ('deleted', v_role, lower(p_username), v_name, v_phone,
            p_admin_username, coalesce(p_admin_name, p_admin_username));
  end if;
  return n;
end;
$$;

-- ═══ RPC: প্রণামি যাচাই টগল (লগসহ — কে যাচাই করল সেটাও থাকে) ═══
create or replace function public.app_set_verified(
  p_table text, p_id uuid, p_verified boolean, p_admin_username text, p_admin_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_amount integer;
begin
  if p_table = 'online' then
    select name, total_amount into v_name, v_amount from public_donations where id = p_id;
    update public_donations
      set verified = p_verified,
          verified_by = case when p_verified then coalesce(p_admin_name, p_admin_username) else null end,
          verified_at = case when p_verified then now() else null end
      where id = p_id;
  elsif p_table = 'field' then
    select name, donation_amount into v_name, v_amount from field_collections where id = p_id;
    update field_collections
      set verified = p_verified,
          verified_by = case when p_verified then coalesce(p_admin_name, p_admin_username) else null end,
          verified_at = case when p_verified then now() else null end
      where id = p_id;
  else
    raise exception 'ভুল টেবিল নাম';
  end if;

  if v_name is not null then
    insert into verification_logs (table_name, record_id, record_name, amount, action, admin_username, admin_name)
    values (p_table, p_id, v_name, coalesce(v_amount, 0),
            case when p_verified then 'verified' else 'unverified' end,
            p_admin_username, coalesce(p_admin_name, p_admin_username));
  end if;
end;
$$;

-- ═══ RPC: যাচাই লগ তালিকা (সব অ্যাডমিন দেখতে পারেন) ═══
create or replace function public.app_list_logs()
returns table (id uuid, table_name text, record_name text, amount integer, action text, admin_username text, admin_name text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select id, table_name, record_name, amount, action, admin_username, admin_name, created_at
  from verification_logs
  order by created_at desc
  limit 500;
$$;

-- ═══ RPC: ইউজার লগ তালিকা (সব অ্যাডমিন দেখতে পারেন) ═══
create or replace function public.app_list_user_logs()
returns table (id uuid, action text, role text, username text, name text, phone text, admin_username text, admin_name text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select id, action, role, username, name, phone, admin_username, admin_name, created_at
  from user_logs
  order by created_at desc
  limit 500;
$$;
