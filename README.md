# PTC Ads — PostgreSQL dengan SQL langsung

Aplikasi Next.js menggunakan PostgreSQL melalui driver `pg` dan schema SQL di root `database.sql`. Prisma tidak lagi digunakan oleh aplikasi aktif. Tidak menggunakan Docker.

## Persyaratan

- Node.js 20+
- PostgreSQL 14+
- npm

## Setup baru

1. Buat database kosong: `createdb -U postgres ptc_ads`.
2. Salin `.env.example` ke `.env`, lalu atur `DATABASE_URL`, `SESSION_SECRET` (minimal 32 karakter), dan `ADMIN_EMAIL`.
3. Install dependency: `npm install`.
4. Terapkan schema: `npm run db:init`.
5. Jalankan aplikasi: `npm run dev`.
6. Daftar dengan email yang sama dengan `ADMIN_EMAIL`, kemudian jalankan `npm run db:seed`.

`npm run db:init` menjalankan `database.sql` melalui driver PostgreSQL. Script ini membuat schema awal dan index; untuk instalasi baru gunakan database kosong.

## Backup dan migrasi SQL

Backup sebelum perubahan schema:

```bash
pg_dump "$DATABASE_URL" -Fc -f backup-before-migration.dump
```

Restore ke database yang sudah dibuat:

```bash
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" backup-before-migration.dump
```

Untuk perubahan berikutnya, simpan skrip berurutan di `database/migrations/NNN_description.sql`, backup database, uji pada staging, jalankan migration dengan `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/NNN_description.sql`, lalu commit file SQL migration bersama perubahan aplikasi. Jangan menjalankan `database.sql` pada database yang berisi data sebelum meninjau dampaknya.

## Catatan

`database.sql` adalah schema bootstrap untuk database baru. Data yang sudah ada di database Prisma tidak otomatis dipindahkan. Migrasi data Prisma ke SQL langsung memerlukan export/transform/import terencana dan backup terpisah. Untuk production, gunakan TLS, backup terjadwal, uji restore, trusted proxy, monitoring, dan security review. Payment manual diproses admin di luar aplikasi.
