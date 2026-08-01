# Known Limitations

These are deliberate boundaries of the interview assignment, not hidden
completion claims.

- Sessions and the current game reference are memory-only in React. A full
  refresh signs out both seats and loses the browser's game reference.
- There is no game discovery, invite link, lobby, matchmaking, or history UI.
  Persisted games can be resumed only while the page still knows the game ID.
- Updates use normal HTTP requests and refetching, not WebSockets or live
  opponent push notifications.
- Registration/login throttling is in process memory. Counters reset when the
  API restarts and are not shared across multiple API instances.
- Finished and abandoned game records have no retention, archival, or deletion
  policy.
- The public player list includes legacy passwordless records from early
  phases. They cannot authenticate, but their usernames remain reserved.
- There is no password reset, email verification, account deletion, or token
  revocation list.
- Render and Atlas free tiers have cold starts, capacity limits, and no
  production availability guarantee.
- The deployment has baseline security headers but no Content Security Policy.
- Browser journeys are manually verified; automated coverage stops at
  component/API E2E boundaries.
- The application has no AI opponent, sound, localization, analytics, or
  offline mode.

These constraints preserve the assignment's focus: secure two-user simulation,
authoritative backend rules, persistence, testing, deployment, and clear
engineering tradeoffs.
