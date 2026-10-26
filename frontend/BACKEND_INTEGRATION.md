# Frontend backend integration notes

The existing RADIX endpoints remain centralized in `src/services/api.js`:

- `POST /profile/build/from-resume` — multipart field `file`; returns the structured profile currently consumed by `ProfileCard`, `SkillsGrid`, and the wizard.
- `POST /jd/extract-skills` — multipart field `file`; the pasted-text adapter creates a PDF and uses the same endpoint.
- `POST /skill-matching/analyze` — JSON `{ jd_source_file, candidate_profile, jd_skills }`; returns the result consumed by `Step6Results`.

The following interfaces are provisional because the current backend has no matching endpoints or schemas. In particular, its current `GET /profile/` route is a health response, so profile persistence uses the proposed `/profiles/me` path instead. `profileService`, `authService`, and `resultsService` isolate those assumptions so their adapters can change without moving request logic into page components.

| Service operation | Provisional request | Provisional response |
| --- | --- | --- |
| Auth `login` | `POST /auth/login` `{ email, password }` | session object with `user` |
| Auth `signup` | `POST /auth/signup` `{ name, email, password }` | session object with `user` |
| Auth `logout` | `POST /auth/logout` | success response |
| Auth `getSession` | `GET /auth/session` | session object or `401` |
| Profile `getProfile` | `GET /profiles/me` | profile object or `404` |
| Profile `saveProfile` | `PUT /profiles/me` with profile JSON | saved profile including optional `updated_at` |
| Results `listResults` | `GET /match-results` | array of saved result objects |
| Results `getResultById` | `GET /match-results/:id` | one saved result or `404` |
| Results `saveResult` | `POST /match-results` with profile and match result | saved result including `id` |

The result page expects saved records to include `id` and `matchResult`; profile, `job_title`, `company`, `match_score`, and `created_at` are optional. The adapter preserves backend results and does not calculate or fabricate persistence data.

## Development mock mode

Set `VITE_ENABLE_DEV_MOCKS=true` in a local `.env` file to enable the in-memory auth, profile, and result adapters. The flag has no effect in production builds (`import.meta.env.DEV` must also be true). Mock sessions, profiles, and history are volatile and disappear on refresh. Mock login only demonstrates navigation; it is not secure authentication. Resume extraction and match analysis still call the existing configured backend.

Without the flag, auth/profile/history adapters make the provisional HTTP requests above. Configure `VITE_API_URL` using the existing environment convention. Never enable the mock flag as a production authentication or persistence provider.

## Deep links in deployment

TanStack Router uses browser history URLs. Configure the static host to serve `index.html` for app routes such as `/login`, `/profile/setup`, `/match`, and `/history/:resultId`, while leaving API and static asset paths untouched. Vite dev and preview servers provide SPA fallback automatically; production hosting must provide its equivalent rewrite.

No server-side route or database has been added by this frontend change.
