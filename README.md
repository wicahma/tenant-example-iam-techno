# IAM Techno — Product Example

Production-quality reference implementation for integrating with the **IAM Techno Public API**. Covers all 19 public API endpoints with full product verification, server-side RSA signing, encrypted token storage, and a polished demo UI.

## Architecture

```
Browser (React) → fetch('/api/public/*') → Next.js Route Handler → IAM Techno Backend
                                                                     ↑ RSA PS256 signature
                                                                     ↑ X-App-Identifier, X-Timestamp,
                                                                       X-Nonce, X-Key-Id, X-Signature,
                                                                       APIKey
```

All product secrets (private key, API key, backend URL) stay **server-side only**. Tokens are stored in encrypted httpOnly cookies.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Fill in .env.local with your product credentials
#    (API_URL, API_KEY, APP_IDENTIFIER, RSA_PRIVATE_KEY, KEY_ID, SECRET_KEY, SALT_KEY)

# 4. Start dev server
npm run dev
```

## Environment Variables

| Variable                     | Required | Description                                                 |
| ---------------------------- | -------- | ----------------------------------------------------------- |
| `API_URL`                    | Yes      | IAM Techno backend URL (e.g., `http://localhost:5000`)      |
| `API_KEY`                    | Yes\*    | Tenant API key (plain text, from registration)              |
| `APP_IDENTIFIER`             | Yes\*    | Tenant identifier (matches `mst_tenants.tenant_identifier`) |
| `RSA_PRIVATE_KEY`            | Yes\*    | RSA 2048-bit private key in PEM format                      |
| `KEY_ID`                     | Yes\*    | Key ID (`kid` from `mst_tenant_keys`)                       |
| `SECRET_KEY`                 | No       | Encryption key for cookie storage (min 32 chars)            |
| `SALT_KEY`                   | No       | Salt for PBKDF2 key derivation (min 16 chars)               |
| `MAX_AGE_COOKIES_IN_DAYS`    | No       | Cookie expiry in days (default: 7)                          |
| `BYPASS_TENANT_VERIFICATION` | No       | Skip RSA signature for dev (default: `false`)               |

\* Not required if `BYPASS_PRODUCT_VERIFICATION=true` (dev mode)

## Project Structure

```
src/
├── config/
│   ├── env.config.ts          — typed env loader (server-only)
│   └── api.config.ts          — axios instances with auto tenant headers + token refresh
├── types/
│   ├── api.types.ts           — APIBaseResponse<T>, IPagination
│   ├── auth.types.ts          — Login, tokens, profile types
│   ├── password.types.ts      — Reset password flow types
│   ├── oauth.types.ts         — OAuth 2.0 / OIDC types
│   └── user.types.ts          — User list types
├── utils/
│   ├── encryption.util.ts     — AES-256-CBC encrypt/decrypt
│   ├── cookie.util.ts         — httpOnly encrypted token storage
│   ├── signature.util.ts      — RSA PS256 signing + canonical JSON
│   ├── error.util.ts          — Error message extraction
│   └── pkce.util.ts           — PKCE verifier/challenge generation
├── services/                  — 'use server' API functions
│   ├── auth.service.ts        — login, logout, refresh, validate, pre-token
│   ├── profile.service.ts     — getMe, getProfile, updateProfile
│   ├── user.service.ts        — getUsers (paginated)
│   ├── password.service.ts    — change, reset send/validate/complete
│   ├── oauth.service.ts       — authorize, token, userinfo, discovery, revoke
│   └── health.service.ts      — healthCheck
├── hooks/                     — Client React hooks
│   ├── useAuth.ts
│   ├── useProfile.ts
│   ├── useUsers.ts
│   ├── usePasswordReset.ts    — Multi-step state machine
│   └── useOAuth.ts
├── components/
│   ├── ui/                    — Button, Input, Card, Spinner, Badge, Select, Pagination, FormField
│   └── layout/Navbar.tsx
└── app/
    ├── api/
    │   ├── public/[...path]/  — Proxy for /public/* (with tenant verification)
    │   ├── oauth/[...path]/   — Proxy for /oauth/* and /.well-known/*
    │   └── health/            — Health check proxy
    ├── page.tsx               — Demo index with endpoint coverage
    ├── login/                 — Manual login form
    ├── me/                    — Profile view + update + change password
    ├── users/                 — Paginated user list
    ├── reset-password/        — Step 1: Send reset
    │   ├── validate/          — Step 2: Validate OTP
    │   └── reset/             — Step 3: Set new password
    └── oauth-demo/            — OAuth flow launcher
        └── callback/          — OAuth callback handler
```

## API Endpoints Covered

| #   | Method | Path                                | Feature              |
| --- | ------ | ----------------------------------- | -------------------- |
| 1   | GET    | `/public/health`                    | Health check         |
| 2   | POST   | `/public/manual/login`              | Manual login         |
| 3   | POST   | `/public/pre-token/claims`          | Pre-token exchange   |
| 4   | POST   | `/public/oauth/login`               | OAuth login          |
| 5   | POST   | `/public/logout`                    | Logout               |
| 6   | POST   | `/public/me/refresh-token`          | Refresh token        |
| 7   | POST   | `/public/validate-token`            | Validate token       |
| 8   | GET    | `/public/me`                        | User detail          |
| 9   | GET    | `/public/me/profile`                | User profile         |
| 10  | PUT    | `/public/me`                        | Update profile       |
| 11  | GET    | `/public/users`                     | User list            |
| 12  | POST   | `/public/me/change-password`        | Change password      |
| 13  | POST   | `/public/reset-password`            | Send reset           |
| 14  | POST   | `/public/reset-password/validate`   | Validate OTP         |
| 15  | POST   | `/public/reset-password/reset`      | Complete reset       |
| 16  | GET    | `/oauth/authorize`                  | OAuth authorize      |
| 17  | POST   | `/oauth/token`                      | OAuth token exchange |
| 18  | GET    | `/oauth/userinfo`                   | OAuth userinfo       |
| 19  | GET    | `/.well-known/openid-configuration` | OIDC Discovery       |
| 20  | POST   | `/oauth/revoke`                     | OAuth revoke         |

## Product Verification

Every request to `/public/*` endpoints includes these headers (generated server-side):

| Header             | Value                                   |
| ------------------ | --------------------------------------- |
| `X-App-Identifier` | Product identifier                      |
| `X-Timestamp`      | ISO 8601 UTC timestamp                  |
| `X-Nonce`          | UUID-based unique nonce                 |
| `X-Key-Id`         | Key ID for RSA verification             |
| `X-Signature`      | RSA PS256 signature of canonical string |
| `APIKey`           | Product API key                         |

Canonical string format: `{timestamp}\n{method}\n{scheme}://{host}\n{pathAndQuery}\n{kid}\n{bodyHash}\n{nonce}`

## Tech Stack

- **Next.js 16** — App Router, Server Actions, Route Handlers
- **React 19** — Client components with hooks
- **Tailwind CSS v4** — Utility-first styling
- **TypeScript 5** — Strict mode
- **axios** — HTTP client with interceptors
- **crypto-js** — AES encryption for cookies
- **react-hot-toast** — Toast notifications
- **Node.js crypto** — RSA PS256 signing

## Related Documentation

- [IAM Techno Public API Docs](../core-service-iam-techno/docs/public-api.md)
- [IAM Techno Auth Services Docs](../core-service-iam-techno/docs/auth-services.md)
