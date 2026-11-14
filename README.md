# VRB DETAILING

## Local development

Install dependencies with `npm install`, copy `.env.example` to `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then run `npm run dev`.

The publishable key is intended for browser use; Row Level Security protects database access. Never expose a Supabase secret/service-role key in frontend code or Git.

## Database

Run `supabase/schema.sql` in the Supabase SQL Editor. It creates customer profiles, vehicles, services, bookings, job updates, RLS policies and an atomic booking-request function. Public registrations default to the customer role. Employee/admin roles must be assigned by a trusted administrator.
