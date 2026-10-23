# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React app thin and focused on rendering, route-driven navigation, and calling the shared API client; avoid putting business logic in components.
- Logic tier decision: Implement Express route handlers and service logic in TypeScript so validation, normalization, and HTTP error handling live in the API layer rather than in the database layer.
- Data tier decision: Use Mongoose schemas and seeded sample data to model users, teams, and activities consistently, with computed fields stored when appropriate for leaderboard and analytics features.
- Activity tracking approach: Accept activity submissions with explicit validation for user and team IDs, normalize the stored fields, and compute points plus occurredAt before persisting to ensure the API returns stable records and avoids Mongoose cast errors leaking as 500s.
- Team management approach: Allow teams to be created with name and mascot, while rejecting invalid or missing names with a clear 400 response; list endpoints should return the persisted team members in a consistent shape.
- Leaderboard approach: Aggregate each team’s activity points in a query-friendly way and sort descending by total so the ranking is deterministic and easy to expose as a 1-based leaderboard list.
- Workout suggestions approach: Match the requested user email against seeded user records, inspect recent activity patterns, and return recommendations whose focus aligns with the user’s fitness goal or recent effort, explaining the reasoning in each suggestion.

## Test plan

Record the commands you run and what each failure means. The current checks cover data persistence, API contract behavior, frontend behavior, and successful builds.

- Data-tier tests: `npm run test:data --prefix octofit-tracker/backend` — verify persisted model data and computed activity fields.
- API tests: `npm run test:api --prefix octofit-tracker/backend` — verify endpoint responses, validation errors, leaderboard results, and workout suggestions.
- Frontend tests: `npm test --prefix octofit-tracker/frontend` — verify the current frontend behavior.
- Backend build: `npm run build --prefix octofit-tracker/backend` — check the TypeScript backend build.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` — check the frontend production build.
