-- VRB DETAILING: reliable employee visibility and admin rescheduling.
-- Run once in Supabase SQL Editor after the admin workflow migration.

-- Assigning a pending request is the admin's approval decision. Make it confirmed
-- in the same transaction so the employee can immediately start the job.
create or replace function public.admin_assign_booking(p_booking_id uuid,p_employee_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_status text; v_old_employee uuid; v_next_status text;
begin
 if v_actor is null or public.current_user_role()<>'admin' then raise exception 'Only administrators can assign jobs'; end if;
 if p_employee_id is not null and not exists(select 1 from public.profiles where id=p_employee_id and role='employee') then raise exception 'Selected user is not an active employee'; end if;
 select status,assigned_employee_id into v_status,v_old_employee from public.bookings where id=p_booking_id for update;
 if not found then raise exception 'Booking not found'; end if;
 if v_status in ('completed','cancelled') then raise exception 'Completed or cancelled jobs cannot be reassigned'; end if;
 if p_employee_id is null and v_status not in ('pending','confirmed') then raise exception 'Active work must be reassigned directly to another employee'; end if;
 v_next_status:=case when p_employee_id is not null and v_status='pending' then 'confirmed' else v_status end;
 update public.bookings
 set assigned_employee_id=p_employee_id,
     assigned_at=case when p_employee_id is null then null else now() end,
     assigned_by=case when p_employee_id is null then null else v_actor end,
     status=v_next_status
 where id=p_booking_id;
 insert into public.job_updates(booking_id,author_id,status,message,visible_to_customer)
 values(p_booking_id,v_actor,v_next_status,
   case when p_employee_id is null then 'Zakázka byla uvolněna do nabídky zaměstnancům.'
        when v_old_employee is null and v_status='pending' then 'Administrátor potvrdil termín a přiřadil zakázku členovi týmu.'
        when v_old_employee is null then 'Zakázka byla přiřazena členovi týmu.'
        else 'Administrátor změnil přiřazení zakázky.' end,true);
end; $$;

-- Reassert the employee visibility policy: assigned bookings must be visible
-- regardless of whether they were created before or after this migration.
drop policy if exists "Customers and relevant staff read bookings" on public.bookings;
create policy "Customers and relevant staff read bookings" on public.bookings for select to authenticated
using (
 customer_id=(select auth.uid())
 or public.current_user_role()='admin'
 or (public.current_user_role()='employee' and
     (assigned_employee_id=(select auth.uid()) or (status='confirmed' and assigned_employee_id is null)))
);

create or replace function public.admin_reschedule_booking(p_booking_id uuid,p_new_start_at timestamptz)
returns void language plpgsql security definer set search_path='' as $$
declare
 v_actor uuid:=auth.uid();
 v_status text;
 v_duration integer;
 v_buffer integer;
 v_end timestamptz;
 v_blocked_until timestamptz;
begin
 if v_actor is null or public.current_user_role()<>'admin' then raise exception 'Only administrators can reschedule bookings'; end if;
 if p_new_start_at is null or p_new_start_at<=now() then raise exception 'Choose a future start time'; end if;

 perform pg_advisory_xact_lock(hashtext('vrb-detailing-booking-calendar'));

 select b.status,s.estimated_minutes,s.buffer_minutes
 into v_status,v_duration,v_buffer
 from public.bookings b join public.service_catalog s on s.id=b.service_id
 where b.id=p_booking_id for update of b;
 if not found then raise exception 'Booking not found'; end if;
 if v_status in ('in_progress','quality_check','ready_for_pickup','completed','cancelled') then
  raise exception 'Cannot reschedule a job after work has started';
 end if;

 v_end:=p_new_start_at+make_interval(mins=>v_duration);
 v_blocked_until:=v_end+make_interval(mins=>v_buffer);

 if exists(
  select 1 from public.bookings b
  where b.id<>p_booking_id
    and b.status in ('pending','confirmed','in_progress')
    and b.start_at<v_blocked_until
    and b.blocked_until>p_new_start_at
 ) then raise exception 'Selected time is not available'; end if;

 update public.bookings
 set start_at=p_new_start_at,estimated_end_at=v_end,blocked_until=v_blocked_until
 where id=p_booking_id;

 insert into public.job_updates(booking_id,author_id,status,message,visible_to_customer)
 values(p_booking_id,v_actor,v_status,
   'Administrátor změnil termín přistavení na '||
   to_char(p_new_start_at at time zone 'Europe/Prague','DD.MM.YYYY HH24:MI')||
   '. Stav a průběh zakázky zůstávají zachovány.',true);
end; $$;

revoke all on function public.admin_reschedule_booking(uuid,timestamptz) from public,anon;
grant execute on function public.admin_reschedule_booking(uuid,timestamptz) to authenticated;
revoke all on function public.admin_assign_booking(uuid,uuid) from public,anon;
grant execute on function public.admin_assign_booking(uuid,uuid) to authenticated;

-- Enable live updates for employee/admin dashboards where Supabase Realtime is available.
do $$
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
    and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='bookings') then
  execute 'alter publication supabase_realtime add table public.bookings';
 end if;
end $$;
