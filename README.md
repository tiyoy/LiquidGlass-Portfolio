# Liquid Glass Personal Portfolio — Next.js + Supabase

Portfolio full-stack dengan tema liquid glass, navigasi mobile bottom bar, animasi lanyard yang dapat ditarik, dashboard CMS, upload foto ke Supabase Storage, dan login admin melalui Supabase Auth dengan cookie sesi.

## 1. Prasyarat
- Node.js 20.9+ (sesuaikan dengan versi Next.js yang dipasang)
- Akun Supabase
- Akun Vercel untuk deployment

## 2. Siapkan Supabase
1. Buat project di https://supabase.com/dashboard.
2. Buka **SQL Editor** dan jalankan seluruh isi `supabase/schema.sql`.
3. Jalankan `supabase/seed.sql` untuk memasukkan konten contoh.
4. Buka **Project Settings → API** dan salin Project URL serta anon/publishable key. Ambil `service_role` key hanya untuk server-side environment variable.
5. Buka **Authentication → Users → Add user** dan buat user admin. Gunakan email yang sama dengan `ADMIN_EMAIL`; tetapkan password kuat. Jika email confirmation aktif, konfirmasikan user tersebut.

> Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di variabel `NEXT_PUBLIC_*`, source code, atau Git. Service role dapat melewati RLS dan hanya boleh digunakan server-side.

## 3. Environment variables
Salin `.env.example` menjadi `.env.local` (Next.js memuat `.env.local` otomatis) dan isi nilai project Anda:

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
ADMIN_EMAIL="email-admin-anda@example.com"
```

Jangan gunakan placeholder saat deploy. `.env.local` sudah di-ignore oleh Git.

## 4. Instal dan jalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`; dashboard admin berada di `http://localhost:3000/admin`. Login dengan email/password user Supabase Auth yang dibuat di langkah 2. Tidak ada lagi `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, Prisma, maupun file SQLite pada versi migrasi ini.

## 5. Deploy ke Vercel
1. Push folder proyek ke repository Git (pastikan `.env.local` tidak ikut commit).
2. Di Vercel pilih **Add New → Project**, impor repository.
3. Di **Settings → Environment Variables**, tambahkan ke Production (dan Preview/Development jika diperlukan):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `ADMIN_EMAIL`
4. Redeploy setelah environment variable disimpan.
5. Di Supabase **Authentication → URL Configuration**, set **Site URL** ke domain production, lalu tambahkan URL deployment Vercel dan URL lokal `http://localhost:3000` ke **Redirect URLs** jika diperlukan.
6. Tes login admin, CRUD proyek/layanan/testimoni, upload foto, dan formulir pesan pada domain production.

## 6. Database, RLS, dan Storage
- `supabase/schema.sql` membuat tabel `Profile`, `Service`, `Project`, `Testimonial`, dan `Message` serta mengaktifkan RLS.
- Pengunjung hanya diberi izin `SELECT` untuk konten portofolio publik; tidak ada akses baca ke tabel pesan.
- Seluruh perubahan konten dilakukan melalui API server yang memeriksa user Supabase Auth dan mencocokkan email dengan `ADMIN_EMAIL`, lalu menggunakan service role server-side.
- Bucket `portfolio-media` dibuat public agar foto yang ditampilkan di website dapat dibaca publik. Upload dilakukan melalui `/api/admin/upload`, yang memerlukan sesi admin, memvalidasi MIME type, dan membatasi ukuran 10 MB.
- `SUPABASE_SERVICE_ROLE_KEY` adalah rahasia berhak tinggi. Jangan mengirimkannya ke browser.

## 7. Migrasi data dari SQLite lama
Migrasi ini menyediakan skema PostgreSQL dan seed data contoh, tetapi **tidak otomatis menyalin data aktual dari `prisma/dev.db` lama**. Jika database lama sudah berisi konten penting:
1. Cadangkan `prisma/dev.db` sebelum menghapus folder versi lama.
2. Ekspor tabel SQLite menjadi CSV/JSON (profile, service, project, testimonial, message).
3. Impor data ke tabel dengan nama kolom yang sama di Supabase Table Editor atau melalui skrip migrasi.
4. Untuk `features` dan `tags`, ubah string JSON SQLite menjadi array JSON sebelum impor ke kolom `jsonb`.
5. Pertahankan ID yang ada untuk menghindari duplikasi dan cek jumlah baris setelah impor.
6. Jangan impor pesan lama bila tidak dibutuhkan atau berisi data pribadi yang tidak perlu.

## 8. Catatan keamanan
- Rute admin memeriksa sesi melalui `supabase.auth.getUser()` dan membatasi akses pada `ADMIN_EMAIL`.
- RLS tetap diaktifkan; service role hanya digunakan di route handler server setelah otorisasi admin (atau pada route publik yang memang perlu menulis pesan).
- Form pesan publik sebaiknya ditambah rate limiting/CAPTCHA sebelum menerima trafik besar.
- Build/deploy harus diuji di lingkungan Anda dengan `npm install`, `npm run lint`, dan `npm run build`.

## Navigasi full-page scroll

Navigasi menggunakan perilaku full-page scroll dengan CSS scroll-snap: gulir mouse, trackpad, atau swipe memindahkan tampilan ke section berikutnya dan berhenti di posisi section yang rapi. Menu navigasi bawah tetap dapat digunakan untuk langsung menuju section pilihan. Tiap section minimal setinggi viewport; section yang memiliki konten lebih panjang dapat digulir secara alami agar isi tidak terpotong. Navbar bawah dan safe-area perangkat sudah diperhitungkan.

Pada viewport desktop yang pendek, lanyard tetap memakai `translateX(-50%) scale(.88)` agar scaling tidak menggeser bingkai foto ke kanan.
