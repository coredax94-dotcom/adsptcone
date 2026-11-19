# PTC Ads MVP

Platform PTC berbasis Next.js, Node.js, TypeScript, PostgreSQL, Prisma, dan Tailwind CSS tanpa Docker dan tanpa payment gateway.

## Fitur saat ini

- Registrasi/login dengan cookie HTTP-only bertanda tangan.
- Wallet dan ledger transaksi yang memakai transaksi database atomic.
- Deposit manual memakai nomor referensi/bukti teks dan persetujuan admin.
- Withdrawal manual dengan penahanan saldo sampai diproses admin; penolakan otomatis mengembalikan saldo.
- Campaign advertiser: dana dipotong saat dibuat, lalu campaign masuk `PENDING_REVIEW`.
- Admin dapat menyetujui campaign menjadi `ACTIVE`; campaign ditolak akan mengembalikan budget.
- PTC view memakai token server, timer, batas satu reward per campaign per hari, dan reward atomic.
- Audit log untuk tindakan review campaign.

## Instalasi tanpa Docker

1. Pastikan Node.js 20+ dan PostgreSQL 14+ tersedia.
2. Buat database PostgreSQL, misalnya `ptc_ads`.
3. Salin `.env.example` menjadi `.env`; isi `DATABASE_URL` dan `SESSION_SECRET` minimal 32 karakter.
4. Jalankan `npm install`.
5. Jalankan `npm run db:generate` lalu `npm run db:migrate` dan beri nama migrasi `init`.
6. Jalankan `npm run dev`, buka `http://localhost:3000`, lalu daftar.
7. Masukkan email akun pada `ADMIN_EMAIL`, kemudian jalankan `npm run db:seed` untuk menjadikannya admin.

## Alur payment manual

1. User mengajukan deposit dan mengisi metode serta referensi pembayaran.
2. Admin memeriksa transfer di rekening/e-wallet di luar aplikasi.
3. Admin menekan `Setujui`; saldo user bertambah dan ledger dibuat.
4. User mengajukan withdrawal; saldo ditahan ketika permintaan dibuat.
5. Admin mengirim pembayaran manual di luar aplikasi lalu menyetujui, atau menolak agar saldo dikembalikan.

## Catatan penting

Versi ini belum dapat disebut production-ready 100% tanpa pengujian di environment PostgreSQL nyata. Sebelum publikasi, wajib menambahkan verifikasi email, reset password, rate limiting, CAPTCHA/anti-fraud yang lebih kuat, upload bukti ke object storage, CSRF/origin protection, backup database, TLS, logging/monitoring, kebijakan privasi, dan review legal. Jangan gunakan sistem untuk traffic palsu, mengakali aturan jaringan iklan, atau konten terlarang.
