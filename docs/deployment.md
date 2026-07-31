# Initial Deployment

## Current state

Phase 7 is deployed on the approved free Render and MongoDB Atlas resources.
The hosted health, exact-origin CORS, frontend, Atlas storage, reload
persistence, hosted CI, and real idle cold-start checks passed on 2026-07-31.
Pull request #8 was merged into `main` as `dd3e1bc`, and the post-merge
Verify and Secret scan jobs passed.

## Planned topology

```text
Browser
  -> https://dice-game-web-igorm1930.onrender.com
  -> https://dice-game-api-igorm1930.onrender.com
  -> MongoDB Atlas M0 / dice_game
```

The Render API is a free Frankfurt Node web service, and the frontend is a free
static site. The Atlas project and M0 cluster are named
`dice-game-production` and use AWS Frankfurt.

Both documented public URLs are live.

## Render Blueprint

`render.yaml` defines:

- API service `dice-game-api-igorm1930`
- frontend service `dice-game-web-igorm1930`
- Node.js 22.22.0
- deployment only after GitHub checks pass
- `/api/health` as the API health check
- an SPA rewrite to `/index.html`
- baseline content-type, framing, referrer, permissions, and asset-cache
  headers

Environment values:

| Service | Key               | Classification               | Source                   |
| ------- | ----------------- | ---------------------------- | ------------------------ |
| API     | `NODE_ENV`        | Public operational value     | Blueprint                |
| API     | `NODE_VERSION`    | Public operational value     | Blueprint                |
| API     | `FRONTEND_ORIGIN` | Public origin                | Blueprint                |
| API     | `MONGODB_URI`     | Secret                       | Enter directly in Render |
| Web     | `NODE_VERSION`    | Public operational value     | Blueprint                |
| Web     | `VITE_API_URL`    | Public browser configuration | Blueprint                |

`VITE_API_URL` is intentionally public because Vite embeds it in the browser
bundle. `MONGODB_URI` must never use a `VITE_` prefix or be stored in Git.

## MongoDB Atlas

Provisioned configuration:

- Project and M0 cluster: `dice-game-production`
- Cloud/region: AWS Frankfurt
- Database: `dice_game`
- Application user: `dice_game_app`
- Authorization: custom role granting only `readWrite` on `dice_game`
- Resource scope: only the production cluster
- Active network ranges: `74.220.51.0/24` and `74.220.59.0/24`
- Wildcard network access: not configured
- Connection string: stored only as Render's `MONGODB_URI` secret

The application rejects production MongoDB values that are not
`mongodb+srv://` URLs or do not contain an explicit database name.

## Provisioning sequence

1. Connect the GitHub repository to Render.
2. Ask Render to create services from `render.yaml`.
3. Confirm both services use the planned names, Frankfurt region, free plans,
   and checks-passed auto-deploy policy.
4. Create Atlas resources and network restrictions as described above.
5. Enter `MONGODB_URI` directly in the API service.
6. Deploy the API and wait for `GET /api/health` to become healthy.
7. Deploy the static site.
8. Confirm the resolved service URLs match the configured origins. If Render
   changes a name, update both `FRONTEND_ORIGIN` and `VITE_API_URL` before
   testing.

No paid fallback is approved. Stop and report if the selected free resources
are unavailable.

The initial API deploy failed with `nest: not found` because `NODE_ENV` set
npm's production omission while the Nest CLI is a build-time development
dependency. Both Render build commands now use
`npm ci --include=dev && npm run build`. This installs build tooling in the
ephemeral build environment without adding it to production runtime
dependencies.

## Production verification

Run only with non-sensitive demonstration data:

1. Request the API health endpoint and confirm HTTP 200 with the documented
   response.
2. Send a request from the exact frontend origin and confirm the CORS header
   names that origin.
3. Confirm an unapproved origin receives no CORS permission.
4. Open the hosted frontend and confirm connected and empty/list states.
5. Create a uniquely named demonstration user.
6. Confirm Atlas contains the user without exposing database credentials.
7. Refresh the page and confirm the user remains visible.
8. Allow the free API service to idle, then confirm the frontend handles the
   cold-start delay and recovers.
9. Review browser console and provider logs for errors and sensitive values.
10. Delete the demonstration user if cleanup is approved.

The measured cold start returned HTTP 200 with the expected health response in
32.4 seconds after more than 15 minutes of API inactivity. The hosted frontend
reconnected afterward and still displayed the persisted demonstration user.

## Security and operational limits

- The user endpoints remain deliberately unauthenticated until Phase 8. Use
  demonstration data only and do not treat them as production accounts.
- Render free web services can spin down and have cold-start delays.
- Atlas M0 and Render free tiers have capacity and availability limits.
- Provider MFA and credentials are entered only by the account owner.
- Provider logs must not include the MongoDB URI or database password.
- No content security policy is added yet. It should be defined after the
  deployed browser console and required resource origins are inspected.

## Rollback and cleanup

Before public verification, rollback means disabling Render auto-deploy or
suspending the services. Complete cleanup means deleting the two Render
services, removing their Atlas IP entries, deleting the application database
user, and deleting the M0 cluster/project if no other data uses them. Confirm
the exact external targets before deletion because provider deletion can be
irreversible.
