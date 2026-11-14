# VRB DETAILING

## Local development

Install dependencies with `npm install`, copy `.env.example` to `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then run `npm run dev`.

The publishable key is intended for browser use; Row Level Security protects database access. Never expose a Supabase secret/service-role key in frontend code or Git.

## Database

Run `supabase/schema.sql` in the Supabase SQL Editor. It creates customer profiles, vehicles, services, bookings, job updates, RLS policies and an atomic booking-request function. Public registrations default to the customer role. Employee/admin roles must be assigned by a trusted administrator.


## Supabase Auth production URLs

In Supabase Dashboard → Authentication → URL Configuration:

- Set **Site URL** to the public production website origin (not localhost).
- Add the exact production account callback URL to **Redirect URLs**, ending in `/ucet`.
- If using a Cloudflare Pages preview hostname, add that preview URL separately. Keep localhost only as an optional development redirect.
- In Authentication → Email Templates → Confirm signup, use the Supabase `{{ .ConfirmationURL }}` variable for the confirmation link. If a custom template builds its own callback URL, it must use `{{ .RedirectTo }}` (or the correct production Site URL), not a hard-coded localhost address.

The account UI requests `window.location.origin + '/ucet'` for signup confirmation and password-reset redirects. Supabase still requires that destination to be present in the Redirect URLs allow list. See the [redirect URL documentation](https://supabase.com/docs/guides/auth/redirect-urls) and [email template variables](https://supabase.com/docs/guides/auth/auth-email-templates).
