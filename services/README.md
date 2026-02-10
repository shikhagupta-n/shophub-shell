# Services (dev-only)

This folder contains **non-frontend** processes you may want to run alongside the microfrontends during local development.

## `mock-api`

A small HTTP server used for:
- health/readiness checks (`/health`)
- quick API stubs (`/api/time`, `/api/echo`)

### Run

From `shophub-shell/`:

```bash
npm run dev:mock-api
```

### Configure

- `PORT` (default: `4000`)

