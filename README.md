# PTC Ads MVP

A minimal paid-to-click advertising application built with Next.js App Router, Node.js, TypeScript, PostgreSQL, Prisma, and Tailwind CSS. This project intentionally does not use Docker.

## Included

- Email/password registration and login with an HTTP-only signed session cookie.
- User dashboard and PostgreSQL wallet ledger.
- Advertiser campaign creation; budget is reserved from the wallet in a database transaction.
- PTC listing and server-validated view token/timer; rewards are credited through an atomic transaction.
- Manual deposit requests and withdrawal requests, with admin approval/rejection and refund ledger entries.
- Admin role setup using a registered email and seed command.

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer
- npm

## Run locally

1. Create a PostgreSQL database, for example `ptc_ads`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, a random `SESSION_SECRET` of at least 32 characters, and `ADMIN_EMAIL`.
3. Install dependencies: `npm install`.
4. Generate the Prisma client and apply the schema: `npm run db:generate` then `npm run db:migrate`.
5. Start the app: `npm run dev` and open `http://localhost:3000`.
6. Register an account using the same address as `ADMIN_EMAIL`, then run `npm run db:seed` to grant the admin role.

The first migration command will prompt for a migration name; use `init`.

## Important MVP notes

- Deposits are manual requests only. Admins must independently verify a payment before approving. No payment gateway or automatic payout is wired because provider credentials and merchant configuration are required.
- The ad view timer is a basic integrity check, not proof that a person watched/read an ad. Before production, add verified captcha/challenge, stricter abuse controls, privacy disclosures, rate limits, email verification, password reset, and payment provider webhooks.
- Campaign destination URLs are opened in a separate tab. Do not use this system to generate artificial traffic, circumvent ad-provider rules, or advertise prohibited content.
- Set strong secrets, enable TLS, configure database backups, and complete security and legal review before public launch.

## Database

Prisma schema: `prisma/schema.prisma`. Use `npm run db:migrate` in development and `npm run db:deploy` for production migrations.
