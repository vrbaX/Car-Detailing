-- VRB DETAILING: initial database schema
-- Run this file in Supabase SQL Editor. Public sign-ups always receive the customer role.
-- Never expose a service-role key in the browser.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer'
    check (role in ('customer', 'employee', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create a customer profile automatically after every successful sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Use a security-definer helper to avoid recursive profile RLS checks.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  make text not null,
  model text not null,
  year integer check (year is null or year between 1886 and 2100),
  registration text,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  estimated_minutes integer not null check (estimated_minutes > 0),
  buffer_minutes integer not null default 60 check (buffer_minutes >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  vehicle_id uuid not null references public.vehicles(id),
  service_id uuid not null references public.service_catalog(id),
  start_at timestamptz not null,
  estimated_end_at timestamptz not null,
  blocked_until timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  customer_note text,
  staff_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_valid_times check (
    start_at < estimated_end_at and estimated_end_at <= blocked_until
  )
);

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create table if not exists public.job_updates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null
    check (status in ('pending', 'confirmed', 'in_progress', 'quality_check', 'ready_for_pickup', 'completed', 'cancelled')),
  message text,
  visible_to_customer boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_owner_id_idx on public.vehicles(owner_id);
create index if not exists bookings_customer_id_idx on public.bookings(customer_id);
create index if not exists bookings_start_at_idx on public.bookings(start_at);
create index if not exists job_updates_booking_id_created_at_idx
  on public.job_updates(booking_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_catalog enable row level security;
alter table public.bookings enable row level security;
alter table public.job_updates enable row level security;

-- Profiles: customers can read their own profile; staff can read profiles for operations.
drop policy if exists "Profiles readable by owner or staff" on public.profiles;
create policy "Profiles readable by owner or staff"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.current_user_role() in ('employee', 'admin'));

-- Users may edit only their own non-privileged profile fields.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Customers and staff read vehicles" on public.vehicles;
create policy "Customers and staff read vehicles"
on public.vehicles for select to authenticated
using (owner_id = (select auth.uid()) or public.current_user_role() in ('employee', 'admin'));

drop policy if exists "Customers create own vehicles" on public.vehicles;
create policy "Customers create own vehicles"
on public.vehicles for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "Owners and staff update vehicles" on public.vehicles;
create policy "Owners and staff update vehicles"
on public.vehicles for update to authenticated
using (owner_id = (select auth.uid()) or public.current_user_role() in ('employee', 'admin'))
with check (owner_id = (select auth.uid()) or public.current_user_role() in ('employee', 'admin'));

drop policy if exists "Active services are public" on public.service_catalog;
create policy "Active services are public"
on public.service_catalog for select
using (active = true or public.current_user_role() in ('employee', 'admin'));

drop policy if exists "Staff manage services" on public.service_catalog;
create policy "Staff manage services"
on public.service_catalog for all to authenticated
using (public.current_user_role() in ('employee', 'admin'))
with check (public.current_user_role() in ('employee', 'admin'));

drop policy if exists "Customers and staff read bookings" on public.bookings;
create policy "Customers and staff read bookings"
on public.bookings for select to authenticated
using (customer_id = (select auth.uid()) or public.current_user_role() in ('employee', 'admin'));

drop policy if exists "Customers create own bookings" on public.bookings;
create policy "Customers create own bookings"
on public.bookings for insert to authenticated
with check (
  customer_id = (select auth.uid())
  and exists (
    select 1 from public.vehicles v
    where v.id = vehicle_id and v.owner_id = (select auth.uid())
  )
);

drop policy if exists "Staff manage bookings" on public.bookings;
create policy "Staff manage bookings"
on public.bookings for update to authenticated
using (public.current_user_role() in ('employee', 'admin'))
with check (public.current_user_role() in ('employee', 'admin'));

drop policy if exists "Customers read visible job updates" on public.job_updates;
create policy "Customers read visible job updates"
on public.job_updates for select to authenticated
using (
  visible_to_customer = true
  and exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.customer_id = (select auth.uid())
  )
  or public.current_user_role() in ('employee', 'admin')
);

drop policy if exists "Staff create job updates" on public.job_updates;
create policy "Staff create job updates"
on public.job_updates for insert to authenticated
with check (public.current_user_role() in ('employee', 'admin'));

-- IMPORTANT:
-- Do not grant customers direct booking writes in production until booking creation
-- is moved behind a database function that calculates service duration/buffer and
-- atomically checks capacity. This initial schema is the secure data foundation.
-- Assign employee/admin roles manually in the Supabase SQL editor after verifying
-- the person's identity. Never expose role selection in public registration.
