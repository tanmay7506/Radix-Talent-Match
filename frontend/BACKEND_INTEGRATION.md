# Frontend backend integration notes

The existing RADIX endpoints remain centralized in `src/services/api.js`:

- `POST /profile/build/from-resume` — multipart field `file`; returns the structured profile currently consumed by `ProfileCard`, `SkillsGrid`, and the wizard.
- `POST /jd/extract-skills` — multipart field `file`; the pasted-text adapter creates a PDF and uses the same endpoint.
- `POST /skill-matching/analyze` — JSON `{ jd_source_file, candidate_profile, jd_skills }`; returns the result consumed by `Step6Results`.

The following interfaces are provisional because the current backend has no matching endpoints or schemas. In particular, its current `GET /profile/` route is a health response, so profile persistence uses the proposed `/profiles/me` path instead. `profileService`, `authService`, and `resultsService` isolate those assumptions so their adapters can change without moving request logic into page components.

| Service operation | Provisional request | Provisional response |
| --- | --- | --- |
| Auth `login` | `POST /auth/login` `{ email, password }` | session object with `user` |
| Auth `signup` | `POST /auth/register` `{ name, email, password }` | `{ user, access_token, token_type, expires_at }`; refresh cookie set |
| Auth `logout` | `POST /auth/logout` | `204`; refresh cookie cleared |
| Auth `getSession` | `GET /auth/session` | Rotates refresh cookie and returns a new access token |
| Profile `getProfile` | `GET /profiles/me` | profile object or `404` |
| Profile `saveProfile` | `PUT /profiles/me` with profile JSON | saved profile including optional `updated_at` |
| Results `listResults` | `GET /match-results` | array of saved result objects |
| Results `getResultById` | `GET /match-results/:id` | one saved result or `404` |
| Results `saveResult` | `POST /match-results` with profile and match result | saved result including `id` |

The result page expects saved records to include `id` and `matchResult`; profile, `job_title`, `company`, `match_score`, and `created_at` are optional. The adapter preserves backend results and does not calculate or fabricate persistence data.

## Development mock mode

Authentication always uses the backend, including in development. Configure the backend auth environment described in `backend/AUTHENTICATION.md`; the browser stores access tokens in memory and sends them as bearer credentials, while the refresh cookie remains HttpOnly. Signup requires a 12 character password. Password reset is not currently provided by the backend.

The existing `VITE_ENABLE_DEV_MOCKS` flag still enables the in-memory profile and result adapters during local development; it does not affect authentication. Resume extraction and match analysis call the configured backend.

With mocks disabled, profile and history adapters make the HTTP requests above. Configure `VITE_API_URL` using the existing environment convention. Never enable the mock flag as a production persistence provider.

## Deep links in deployment

TanStack Router uses browser history URLs. Configure the static host to serve `index.html` for app routes such as `/login`, `/profile/setup`, `/match`, and `/history/:resultId`, while leaving API and static asset paths untouched. Vite dev and preview servers provide SPA fallback automatically; production hosting must provide its equivalent rewrite.

The auth endpoints and database migration are defined by the backend contract in `backend/AUTHENTICATION.md`.
