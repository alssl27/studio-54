# STUDIO 54 deployment runbook

This runbook covers the current Express/PostgreSQL prototype. Production business content, email delivery, and a managed deployment platform are not included yet. A protected staff dashboard is included for appointment status and enquiry review.

## Environment

Required:

- `PORT` — HTTP port; defaults to `3000`.
- `DATABASE_URL` — PostgreSQL connection string. Booking, contact enquiries, services, stylists, and availability require this value.

Copy `.env.example` to `.env`, replace the placeholder connection string, and keep `.env` out of source control.

## Install and migrate

```powershell
npm ci
psql "$env:DATABASE_URL" -f db/schema.sql
npm run create-staff-user
```

The schema uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and an additive `ALTER TABLE` for the confirmation reference. Before applying it to an existing database, inspect non-cancelled appointment duplicates because the active-slot unique index requires one appointment per date/time.

## Run and verify

```powershell
npm start
Invoke-WebRequest http://localhost:3000/healthz
npm test
```

`/healthz` returns `status: "ok"` and indicates whether `DATABASE_URL` is configured. It does not expose credentials or claim that a database query succeeded.

## Backups and rollback

Create a database backup before schema changes:

```powershell
pg_dump "$env:DATABASE_URL" --format=custom --file=studio54-predeploy.dump
```

The application has no automated migration rollback. To roll back an application release, deploy the previous source revision. To restore data, stop writes, restore the approved backup with `pg_restore`, and rerun the health and smoke checks.

## Logs and monitoring

The server writes startup and database-operation failures to standard output/error. The hosting platform should retain those streams, alert on process exits and repeated HTTP 5xx responses, and probe `/healthz`. Do not log request bodies, customer email addresses, or database credentials.

## Deployment checklist

1. Replace fictional public business content with approved salon content.
2. Set production `PORT` and `DATABASE_URL` as secret environment variables.
3. Run `psql "$env:DATABASE_URL" -f db/schema.sql` against a backup-protected database.
4. Start the server and verify `/healthz`.
5. Run `npm test` and smoke-test booking, contact, and availability flows.
6. Open `/admin.html` and verify staff login, appointment status updates, and enquiry visibility over HTTPS.
7. Confirm CSP, HTTPS termination, log retention, backups, and rollback ownership with the hosting provider.
