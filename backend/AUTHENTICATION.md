# Custom authentication configuration

Authentication is handled by FastAPI and the existing Supabase PostgREST API. The browser uses the API only; it must not use Supabase Auth or query `public.users`, `public.education`, or `public.refresh_tokens` directly.

Configure these variables in the backend environment (never in `VITE_*` variables):

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<existing-backend-service-role-key>
APP_AUTH_SECRET=<at-least-32-random-bytes>
APP_AUTH_ISSUER=radix-talent-match
APP_ACCESS_TOKEN_MINUTES=15
APP_REFRESH_TOKEN_DAYS=30
APP_COOKIE_SECURE=true
```

Generate the app secret locally with `python -c 'import secrets; print(secrets.token_urlsafe(48))'` and place it directly in the backend secret manager or local backend `.env`. Do not commit it or paste it into chat. FastAPI uses `SUPABASE_SERVICE_ROLE_KEY` for privileged PostgREST operations when set; otherwise it uses `SUPABASE_KEY`. Both must be backend-only keys with the required privileges. Keep `SUPABASE_KEY` available for existing data reads. Do not expose either server key or `APP_AUTH_SECRET` to Vite.

Apply the custom-auth SQL directly in the Supabase SQL Editor. It removes only the foreign keys and default that bind custom users and education records to Supabase Auth, then links education ownership to `public.users`; it also creates the refresh-token table and atomic rotation function. The backend derives every ownership predicate from the verified access JWT.

Refresh tokens are random opaque values. The API stores only SHA-256 hashes in `public.refresh_tokens` and transports refresh tokens in an HttpOnly, SameSite=Lax cookie scoped to `/` so it works with both root and `/api` routes. Access tokens are short-lived JWTs returned by the API and should be held in memory by the client. Local development over plain HTTP may set `APP_COOKIE_SECURE=false`; production must use HTTPS and keep it `true`.

The `public.users` schema does not include extracted skills or arbitrary resume fields. The profile API persists only its existing columns and the related education row; adding persistence for additional candidate fields requires a separately reviewed schema change.
