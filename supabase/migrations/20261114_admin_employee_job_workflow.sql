
-- Keep a staff-readable customer email in profiles for account administration.
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is distinct from u.email;
create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin update public.profiles set email = new.email where id = new.id; return new; end; $$;
drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated after update of email on auth.users for each row execute function public.sync_profile_email();

-- VRB DETAILING: admin role management and atomic employee job assignment.
-- Run once in Supabase SQL Editor after the existing schema migrations.
alter table public.bookings add column if not exists assigned_employee_id uuid references public.profiles(id) on delete set null, add column if not exists assigned_at timestamptz, add column if not exists assigned_by uuid references public.profiles(id) on delete set null;
create index if not exists bookings_assigned_employee_idx on public.bookings(assigned_employee_id);
create index if not exists bookings_available_jobs_idx on public.bookings(status,start_at) where assigned_employee_id is null;

create or replace function public.admin_set_user_role(p_user_id uuid,p_role text)
returns void language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_current_role text;
begin
 if v_actor is null or public.current_user_role()<>'admin' then raise exception 'Only administrators can manage user roles'; end if;
 if p_role not in ('customer','employee') then raise exception 'Administrators can only assign customer or employee roles'; end if;
 if p_user_id=v_actor then raise exception 'Administrators cannot change their own role'; end if;
 select role into v_current_role from public.profiles where id=p_user_id for update;
 if not found then raise exception 'User profile not found'; end if;
 if v_current_role='admin' then raise exception 'Administrator roles cannot be changed here'; end if;
 if v_current_role='employee' and p_role='customer' and exists(select 1 from public.bookings where assigned_employee_id=p_user_id and status not in ('completed','cancelled')) then raise exception 'Reassign or complete this employee active jobs before removing employee access'; end if;
 update public.profiles set role=p_role where id=p_user_id;
end; $$;

create or replace function public.claim_booking(p_booking_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();
begin
 if v_actor is null or public.current_user_role()<>'employee' then raise exception 'Only employees can claim available jobs'; end if;
 update public.bookings set assigned_employee_id=v_actor,assigned_at=now(),assigned_by=v_actor where id=p_booking_id and status='confirmed' and assigned_employee_id is null;
 if not found then raise exception 'This job is no longer available'; end if;
 insert into public.job_updates(booking_id,author_id,status,message,visible_to_customer) values(p_booking_id,v_actor,'confirmed','Zakázku převzal člen týmu.',true);
end; $$;

create or replace function public.admin_assign_booking(p_booking_id uuid,p_employee_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_status text; v_old_employee uuid;
begin
 if v_actor is null or public.current_user_role()<>'admin' then raise exception 'Only administrators can assign jobs'; end if;
 if p_employee_id is not null and not exists(select 1 from public.profiles where id=p_employee_id and role='employee') then raise exception 'Selected user is not an active employee'; end if;
 select status,assigned_employee_id into v_status,v_old_employee from public.bookings where id=p_booking_id for update;
 if not found then raise exception 'Booking not found'; end if;
 if v_status in ('completed','cancelled') then raise exception 'Completed or cancelled jobs cannot be reassigned'; end if;
 update public.bookings set assigned_employee_id=p_employee_id,assigned_at=case when p_employee_id is null then null else now() end,assigned_by=v_actor where id=p_booking_id;
 insert into public.job_updates(booking_id,author_id,status,message,visible_to_customer) values(p_booking_id,v_actor,v_status,case when p_employee_id is null then 'Zakázka byla uvolněna do nabídky zaměstnancům.' when v_old_employee is null then 'Zakázka byla přiřazena členovi týmu.' else 'Administrátor změnil přiřazení zakázky.' end,true);
end; $$;

create or replace function public.staff_update_booking_status(p_booking_id uuid,p_status text,p_message text default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_role text:=public.current_user_role(); v_assignee uuid; v_current_status text; v_message text;
begin
 if v_actor is null or v_role not in ('admin','employee') then raise exception 'Staff access required'; end if;
 if p_status not in ('pending','confirmed','in_progress','quality_check','ready_for_pickup','completed','cancelled','rescheduled') then raise exception 'Invalid booking status'; end if;
 select status,assigned_employee_id into v_current_status,v_assignee from public.bookings where id=p_booking_id for update;
 if not found then raise exception 'Booking not found'; end if;
 if v_role='employee' then
  if v_assignee<>v_actor then raise exception 'You can only update jobs assigned to you'; end if;
  if p_status not in ('in_progress','quality_check','ready_for_pickup','completed') then raise exception 'Employees cannot set this booking status'; end if;
  if v_current_status in ('completed','cancelled') then raise exception 'This job is already closed'; end if;
 end if;
 update public.bookings set status=p_status where id=p_booking_id;
 v_message:=coalesce(nullif(trim(p_message),''),'Stav zakázky: '||p_status);
 insert into public.job_updates(booking_id,author_id,status,message,visible_to_customer) values(p_booking_id,v_actor,p_status,v_message,true);
end; $$;

drop policy if exists "Staff manage bookings" on public.bookings;
revoke insert,update,delete on public.bookings from anon,authenticated;
grant select on public.bookings to authenticated;
drop policy if exists "Staff create job updates" on public.job_updates;
revoke insert,update,delete on public.job_updates from anon,authenticated;
grant select on public.job_updates to authenticated;
drop policy if exists "Staff manage services" on public.service_catalog;
create policy "Admins manage services" on public.service_catalog for all to authenticated using(public.current_user_role()='admin') with check(public.current_user_role()='admin');

revoke all on function public.admin_set_user_role(uuid,text) from public,anon;
revoke all on function public.claim_booking(uuid) from public,anon;
revoke all on function public.admin_assign_booking(uuid,uuid) from public,anon;
revoke all on function public.staff_update_booking_status(uuid,text,text) from public,anon;
grant execute on function public.admin_set_user_role(uuid,text) to authenticated;
grant execute on function public.claim_booking(uuid) to authenticated;
grant execute on function public.admin_assign_booking(uuid,uuid) to authenticated;
grant execute on function public.staff_update_booking_status(uuid,text,text) to authenticated;
