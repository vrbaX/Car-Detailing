-- VRB DETAILING — initial Supabase schema
-- Run in Supabase SQL Editor. Public sign-ups are always customers.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','employee','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $set_updated_at$
begin
  NEW.updated_at := now();
  RETURN NEW;
end;
$set_updated_at$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = '' as $$
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
  estimated_minutes integer not null check (estimated_minutes between 15 and 10080),
  buffer_minutes integer not null default 60 check (buffer_minutes between 0 and 1440),
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
    check (status in ('pending','confirmed','in_progress','completed','cancelled','rescheduled')),
  customer_note text,
  staff_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_valid_times check (start_at < estimated_end_at and estimated_end_at <= blocked_until)
);
drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at before update on public.bookings
for each row execute function public.set_updated_at();

create table if not exists public.job_updates (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  status text not null check (status in ('pending','confirmed','in_progress','quality_check','ready_for_pickup','completed','cancelled')),
  message text,
  visible_to_customer boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_owner_id_idx on public.vehicles(owner_id);
create index if not exists bookings_customer_id_idx on public.bookings(customer_id);
create index if not exists bookings_start_at_idx on public.bookings(start_at);
create index if not exists job_updates_booking_id_created_at_idx on public.job_updates(booking_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_catalog enable row level security;
alter table public.bookings enable row level security;
alter table public.job_updates enable row level security;

drop policy if exists "Profiles readable by owner or staff" on public.profiles;
create policy "Profiles readable by owner or staff" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.current_user_role() in ('employee','admin'));
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Customers and staff read vehicles" on public.vehicles;
create policy "Customers and staff read vehicles" on public.vehicles for select to authenticated
using (owner_id = (select auth.uid()) or public.current_user_role() in ('employee','admin'));
drop policy if exists "Customers create own vehicles" on public.vehicles;
create policy "Customers create own vehicles" on public.vehicles for insert to authenticated
with check (owner_id = (select auth.uid()));
drop policy if exists "Owners and staff update vehicles" on public.vehicles;
create policy "Owners and staff update vehicles" on public.vehicles for update to authenticated
using (owner_id = (select auth.uid()) or public.current_user_role() in ('employee','admin'))
with check (owner_id = (select auth.uid()) or public.current_user_role() in ('employee','admin'));

drop policy if exists "Active services are public" on public.service_catalog;
create policy "Active services are public" on public.service_catalog for select
using (active = true or public.current_user_role() in ('employee','admin'));
drop policy if exists "Staff manage services" on public.service_catalog;
create policy "Staff manage services" on public.service_catalog for all to authenticated
using (public.current_user_role() in ('employee','admin'))
with check (public.current_user_role() in ('employee','admin'));

drop policy if exists "Customers and staff read bookings" on public.bookings;
create policy "Customers and staff read bookings" on public.bookings for select to authenticated
using (customer_id = (select auth.uid()) or public.current_user_role() in ('employee','admin'));
drop policy if exists "Staff manage bookings" on public.bookings;
create policy "Staff manage bookings" on public.bookings for all to authenticated
using (public.current_user_role() in ('employee','admin'))
with check (public.current_user_role() in ('employee','admin'));

drop policy if exists "Customers read visible job updates" on public.job_updates;
create policy "Customers read visible job updates" on public.job_updates for select to authenticated
using (
  (visible_to_customer = true and exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.customer_id = (select auth.uid())
  )) or public.current_user_role() in ('employee','admin')
);
drop policy if exists "Staff create job updates" on public.job_updates;
create policy "Staff create job updates" on public.job_updates for insert to authenticated
with check (public.current_user_role() in ('employee','admin'));

-- Atomic booking creation: server derives duration/buffer and checks overlap.
-- The advisory lock serializes slot claims for a calendar day.
create or replace function public.request_booking(
  p_vehicle_id uuid,
  p_service_id uuid,
  p_start_at timestamptz,
  p_customer_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_duration integer;
  v_buffer integer;
  v_end timestamptz;
  v_blocked_until timestamptz;
  v_booking_id uuid;
begin
  if v_customer_id is null then raise exception 'Authentication required'; end if;
  if p_start_at is null or p_start_at <= now() then raise exception 'Choose a future start time'; end if;

  if not exists (
    select 1 from public.vehicles
    where id = p_vehicle_id and owner_id = v_customer_id
  ) then raise exception 'Vehicle not found'; end if;

  select estimated_minutes, buffer_minutes into v_duration, v_buffer
  from public.service_catalog where id = p_service_id and active = true;
  if not found then raise exception 'Service is unavailable'; end if;

  v_end := p_start_at + make_interval(mins => v_duration);
  v_blocked_until := v_end + make_interval(mins => v_buffer);

  perform pg_advisory_xact_lock(hashtext('vrb-detailing-booking-calendar'));

  if exists (
    select 1 from public.bookings b
    where b.status in ('pending','confirmed','in_progress')
      and b.start_at < v_blocked_until
      and b.blocked_until > p_start_at
  ) then
    raise exception 'This time is no longer available';
  end if;

  insert into public.bookings (
    customer_id, vehicle_id, service_id, start_at, estimated_end_at, blocked_until, customer_note
  ) values (
    v_customer_id, p_vehicle_id, p_service_id, p_start_at, v_end, v_blocked_until, p_customer_note
  ) returning id into v_booking_id;

  insert into public.job_updates (booking_id, author_id, status, message)
  values (v_booking_id, v_customer_id, 'pending', 'Žádost o termín byla přijata.');

  return v_booking_id;
end;
$$;
revoke all on function public.request_booking(uuid, uuid, timestamptz, text) from public;
grant execute on function public.request_booking(uuid, uuid, timestamptz, text) to authenticated;

-- Public users can never set their own staff role. Assign staff roles only
-- from the Supabase SQL editor after independently verifying the person.


-- Initial service catalog for VRB DETAILING.
-- Durations and buffers are operational starting estimates; adjust them to the real workflow.
insert into public.service_catalog (name, description, estimated_minutes, buffer_minutes, active, sort_order)
select v.name, v.description, v.estimated_minutes, v.buffer_minutes, true, v.sort_order
from (values
  ('Čištění interiéru', 'Hloubkové vyčištění interiéru včetně čalounění, koberců a plastů.', 240, 60, 1),
  ('Péče o exteriér', 'Šetrné ruční mytí a dekontaminace povrchu vozu.', 120, 45, 2),
  ('Korekce laku', 'Leštění laku podle jeho stavu a rozsahu požadované korekce.', 360, 90, 3),
  ('Ochrana laku', 'Příprava povrchu a aplikace ochranného povlaku.', 480, 120, 4)
) as v(name, description, estimated_minutes, buffer_minutes, sort_order)
where not exists (
  select 1 from public.service_catalog existing where existing.name = v.name
);
