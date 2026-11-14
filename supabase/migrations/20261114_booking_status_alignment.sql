-- Bring existing VRB DETAILING databases in line with the booking status choices in the staff UI.
-- Safe to run more than once.
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check
  check (status in ('pending','confirmed','in_progress','quality_check','ready_for_pickup','completed','cancelled','rescheduled'));

alter table public.job_updates drop constraint if exists job_updates_status_check;
alter table public.job_updates
  add constraint job_updates_status_check
  check (status in ('pending','confirmed','in_progress','quality_check','ready_for_pickup','completed','cancelled','rescheduled'));
