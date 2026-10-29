# Custom authentication configuration

Authentication is handled by FastAPI and the existing Supabase PostgREST API. The browser uses the API only; it must not use Supabase Auth or query `public.users` or `public.education` directly.

Configure these variables in the backend environment (never in `VITE_*` variables):

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<existing-backend-service-role-key>
APP_AUTH_SECRET=<at-least-32-random-bytes>
APP_AUTH_ISSUER=radix-talent-match
APP_ACCESS_TOKEN_MINUTES=43200
```

Generate the app secret locally with `python -c 'import secrets; print(secrets.token_urlsafe(48))'` and place it directly in the backend secret manager or local backend `.env`. Do not commit it or paste it into chat. FastAPI uses `SUPABASE_SERVICE_ROLE_KEY` for privileged PostgREST operations when set; otherwise it uses `SUPABASE_KEY`. Both must be backend-only keys with the required privileges. Keep `SUPABASE_KEY` available for existing data reads. Do not expose either server key or `APP_AUTH_SECRET` to Vite.

Apply the custom-auth SQL directly in the Supabase SQL Editor. It removes only the foreign keys and default that bind custom users and education records to Supabase Auth, then links education ownership to `public.users`. The backend derives every ownership predicate from the verified access JWT.

Login returns a signed access JWT that the browser keeps as the active session in local storage. The default lifetime is 30 days (`APP_ACCESS_TOKEN_MINUTES=43200`); after expiry, the user signs in again. Logout clears the browser session. There is no refresh-token cookie or refresh-token database table requirement.

Resume profile skills are stored as structured JSON in `public.users.skills`. Apply `migrations/20261029_add_user_skills.sql` in the Supabase SQL Editor before deploying the profile API changes. Education continues to be stored in the related `public.education` row; extracted education is saved when degree, college, graduation year, and CGPA are complete and valid.
