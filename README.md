# Expense Tracker

Next.js (App Router) + Tailwind + shadcn/ui + Supabase + Telegram Bot API + Vercel Cron.

## Setup

1. Buat project Supabase, lalu jalankan `supabase/schema.sql` di SQL Editor.
2. Buat bot lewat @BotFather, ambil token. Kirim satu pesan ke bot, lalu ambil chat id dari `https://api.telegram.org/bot<TOKEN>/getUpdates`.
3. Salin `.env.example` ke `.env.local` dan isi semua nilainya (`CRON_SECRET`: string acak panjang).
4. `npm install && npm run dev`.

## Deploy

Isi env var yang sama di Vercel. `vercel.json` mendaftarkan dua cron (waktu UTC):

- `/api/cron/weekly`: Minggu 13:00 UTC (20:00 WIB), ringkasan 7 hari terakhir.
- `/api/cron/monthly`: tanggal 1, 01:00 UTC (08:00 WIB), ringkasan bulan sebelumnya.

Vercel mengirim `Authorization: Bearer $CRON_SECRET`; route menolak request tanpa header itu.

## Catatan

- Alert anggaran (>= 80% dan >= 100%) dikirim saat pengeluaran dicatat, sekali per level per kategori per bulan (`alert_log`).
- Aplikasi belum punya login. Siapa pun yang tahu URL bisa melihat dan menambah data. Tambahkan auth (mis. Supabase Auth atau Vercel Passport) sebelum dipakai publik.
