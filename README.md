# PTC Ads — PostgreSQL dengan SQL langsung

Aplikasi Next.js menggunakan PostgreSQL melalui driver `pg` dan schema SQL di root `database.sql`. Aplikasi tidak menggunakan Prisma dan tidak menggunakan Docker.

## Persyaratan

- Node.js 20+
- PostgreSQL 14+
- npm

## Setup database baru

1. Buat database kosong: `createdb -U postgres ptc_ads`.
2. Salin `.env.example` menjadi `.env`; isi `DATABASE_URL`, `SESSION_SECRET` acak minimal 32 karakter, dan `ADMIN_EMAIL`.
3. Install: `npm install`.
4. Inisialisasi: `npm run db:init`.
5. Jalankan: `npm run dev`.
6. Daftar dengan alamat yang sama dengan `ADMIN_EMAIL`, lalu jalankan `npm run db:seed`.

`npm run db:init` menjalankan `database.sql` untuk database baru/kosong. Jangan menganggap `CREATE TABLE IF NOT EXISTS` sebagai migrasi schema pada database lama.

## Backup dan migrasi

Sebelum perubahan schema/produksi, backup:

```bash
pg_dump "$DATABASE_URL" -Fc -f backup-before-migration.dump
```

Restore ke database target yang sudah dibuat:

```bash
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" backup-before-migration.dump
```

Simpan migration SQL bernomor di `database/migrations/`, uji pada staging, backup, lalu jalankan dengan `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/migrations/NNN_description.sql`. File schema bootstrap bukan pengganti migration versioned.

## Catatan

Database Prisma lama tidak otomatis dipindahkan. Backup data lama, buat database target baru, dan lakukan export/transform/import terencana. Proses migrasi legacy harus diuji sebelum mengganti production database.

Payment manual diproses oleh admin di luar aplikasi. Jangan gunakan saldo nyata sebelum pengujian PostgreSQL, build, keamanan, backup, dan restore selesai.
