# Design

## Architecture

    Expo app (React Native, TypeScript)
          │  HTTPS + JSON, Bearer JWT
          ▼
    Express API (Node.js)  ──SMTP──▶  Mailpit (local mail catcher)
          │  pg (parameterised SQL)
          ▼
    PostgreSQL 16

Everything runs with `docker compose up --build`.

**Backend.** Express with one controller per area (auth, OTP, profile, tasks) and a
`requireAuth` middleware that verifies the JWT and sets `req.userId`. Protected routes
never take a user ID from the request body. Errors use one shape everywhere:
`{ error: { code, message, fields? } }`.

**Data model.**
- `users`: email, bcrypt password hash, `is_verified`, `profile_completed`
- `email_otps`: one active code per user (HMAC hash, expiry, attempts, last sent time)
- `profiles`: name, mobile (+91), address, optional business name
- `task_categories`, `tasks`: seeded catalogue (25 tasks, 5 categories)
- `user_tasks`: the user's selection (many-to-many)

**App.** Expo Router with two route groups: `(auth)` for register, verify and login, and
`(app)` for profile, task selection and home. The JWT is stored
in SecureStore, so the session survives restarts. After login, `profileCompleted` from the
server decides whether the user sees the profile screen (shown once) or home.

## Trade-offs

- **Single JWT (7 days), no refresh token.** Simple and stateless; the cost is that
  logout can't revoke a token server-side and a stolen token stays valid until expiry.


  ## What I left out

- Paramenter validation for several routes server side.
- User screens are not guarded by a token check yet.
- Refresh tokens and server-side logout/revocation.
- Profile icon in homepage doesnt show user profile data. It directly logs out.
- Select all option in group wise selector.
- Search tasks feature.
- Redundant styles are left to clear in native files
- Unit tests are left for a few cases.
