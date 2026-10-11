# Bilder Leads (Bilderlabs Dashboard)

CRM outreach untuk Bilder Labs. Dashboard ini menyusun pekerjaan harian (cek inbox, balas, follow-up, Email 1 baru, mock-up), menyimpan status setiap lead, dan bisa dipakai berdua (Bagus & Andre) dari laptop atau HP di **https://leads.bilderlabs.com**.

- **Hosting:** Cloudflare Workers (tampilan + API dalam satu deploy, cara yang sama dengan bilderlabs.com)
- **Database:** Cloudflare D1 (SQLite di Cloudflare)
- **Server:** [Hono](https://hono.dev), frontend HTML + CSS + JavaScript biasa tanpa build step
- **Login:** username + password per orang, sesi 30 hari, setiap perubahan tercatat siapa yang melakukannya

Untuk dua pengguna, pemakaian jauh di bawah batas paket gratis Workers dan D1.

## Isi dashboard

| Halaman | Fungsi |
| --- | --- |
| Hari ini | Checklist berurutan: cek inbox → balas → follow-up → Email 1 baru → mock-up → tutup sequence → hubungi lagi. Ada jam kirim per zona waktu (dalam WIB). |
| Mode kirim | Email muncul satu per satu: salin alamat, subjek, isi, lalu "Terkirim, lanjut". Tanggal follow-up langsung terjadwal. |
| Leads | Tab per status dengan tampilan List atau Kartu. |
| Jadwal | Semua yang jatuh tempo 14 hari ke depan, yang terlambat di paling atas. |
| Pipeline | Posisi setiap lead di alur outreach. |
| Laporan | Funnel per negara, email terkirim per hari, balasan per niche, alasan lost, nilai won. |
| Template & aturan | Jeda follow-up, kuota harian, template email & balasan, alamat pos, daftar jangan dihubungi. |
| Import / export | Import CSV hasil scraping (duplikat dilewati), export CSV, cadangan JSON. |

Ada mode gelap (tombol bulan/matahari di kanan atas).

## Struktur project

```
Bilderlabs Dashboard/
├── src/
│   ├── worker.js      # API + penyajian file dashboard
│   ├── leads.js       # validasi & query D1
│   └── auth.js        # hash password (PBKDF2) & token sesi
├── public/            # tampilan dashboard (index.html, login.html, app.js, app.css)
├── migrations/        # skema database D1
├── scripts/
│   ├── seed-sql.mjs   # ubah data/seed.json jadi SQL
│   └── user.mjs       # tambah user / ganti password
├── data/
│   ├── seed.json      # 102 lead dari sheet 8 Okt + template email
│   └── default-settings.json
├── wrangler.jsonc     # konfigurasi Cloudflare (domain, database)
└── _arsip-docker-mysql/  # versi lama untuk homelab (Docker + MySQL), tidak dipakai
```

## Deploy pertama kali

Butuh Node.js 20 atau lebih baru di laptop. Semua perintah dijalankan dari folder project:

```bash
cd ~/Documents/Work/"Bilderlabs Dashboard"
npm install
```

### 1. Login ke akun Cloudflare yang memegang domain bilderlabs.com

```bash
npx wrangler login
npx wrangler whoami
```

Pastikan `whoami` menampilkan akun tempat bilderlabs.com berada. Kalau Anda punya beberapa akun, tambahkan `"account_id": "…"` di `wrangler.jsonc` (ID akun ada di hasil `whoami`).

### 2. Buat database

```bash
npx wrangler d1 create bilder-leads
```

Salin nilai `database_id` yang muncul, lalu tempel di `wrangler.jsonc` menggantikan `GANTI_DENGAN_DATABASE_ID`. Kalau Wrangler menawarkan untuk menambahkan konfigurasi otomatis, pilih **No** karena bagian itu sudah ada.

### 3. Buat tabel dan masukkan data awal

```bash
npm run db:migrate
npm run db:seed
```

### 4. Buat user login

```bash
npm run user:add -- bagus "Bagus"
npm run user:add -- andre "Andre"
```

Password diminta saat perintah dijalankan (minimal 10 karakter, tidak tampil di layar). Password di-hash di laptop sebelum dikirim, jadi yang tersimpan di Cloudflare hanya hash-nya.

### 5. Deploy

```bash
npm run deploy
```

Wrangler otomatis membuat DNS dan sertifikat HTTPS untuk `leads.bilderlabs.com`. Tunggu satu-dua menit, lalu buka https://leads.bilderlabs.com.

Mau nama subdomain lain? Ganti `leads.bilderlabs.com` di `wrangler.jsonc` sebelum deploy.

## Deploy otomatis lewat GitHub (opsional)

Setelah langkah 1–4 di atas selesai dari laptop (database dan user tidak bisa dibuat lewat push), deploy berikutnya bisa otomatis setiap kali ada push ke GitHub:

1. Buat repo **private** di GitHub, lalu push folder ini:

   ```bash
   git init
   git add .
   git commit -m "Bilder Leads dashboard"
   git branch -M main
   git remote add origin git@github.com:bagusadhy/bilderlabs-dashboard.git
   git push -u origin main
   ```

   `data/seed.json` (data lead asli) sudah dikecualikan lewat `.gitignore`, jadi tidak ikut ter-upload.
2. Di dashboard Cloudflare: **Workers & Pages → Create → Import a repository** → pilih repo tadi.
3. Isi **nama project `bilderlabs-dashboard`** (harus sama dengan `name` di `wrangler.jsonc`). Build command dikosongkan, deploy command biarkan `npx wrangler deploy`.
4. Simpan. Mulai sekarang setiap push ke `main` otomatis ter-deploy, termasuk domain `leads.bilderlabs.com` dari `wrangler.jsonc`.

Kalau nanti ada file migrasi baru, jalankan `npm run db:migrate` dari laptop sebelum push.

## Perintah sehari-hari

```bash
npm run deploy                          # terbitkan perubahan kode
npm run user:list                       # lihat user
npm run user:password -- bagus          # ganti password (sesi lama ikut keluar)
npm run backup                          # simpan seluruh database ke backup-bilder-leads.sql
npx wrangler tail                       # lihat log server secara langsung
```

Menu **Import / export → Cadangan JSON** juga mengunduh semua data dari browser. D1 juga menyimpan riwayat perubahan beberapa hari ke belakang (fitur Time Travel), jadi database bisa dikembalikan ke waktu tertentu kalau ada kesalahan.

Kalau skema database berubah: tambahkan file baru di `migrations/` (misalnya `0002_…sql`), lalu `npm run db:migrate` dan `npm run deploy`.

## Menambah lead baru

1. **Lewat dashboard:** Import / export → taruh file CSV. Kolomnya: `business, country, city, niche, phone, email, email_confidence, email_source, contact_name, rating, reviews, score, website_check, personal_hook, facebook, maps_url, subject_1, email_1, subject_2, email_2, subject_3, email_3, stage, notes`. Yang wajib hanya `business` dan `country` (AU/US).
2. **Lewat API (untuk n8n atau skrip):**

   ```bash
   npx wrangler secret put API_TOKEN     # isi dengan hasil: openssl rand -hex 32
   ```

   ```bash
   curl -X POST https://leads.bilderlabs.com/api/leads/import \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"leads":[{"business":"Example Plumbing","country":"US","city":"Austin TX","niche":"Plumber","email":"info@example.com"}]}'
   ```

   Maksimal 25 lead per permintaan. Duplikat (email, telepon, atau nama + kota sama) dan alamat di daftar jangan dihubungi otomatis dilewati.

## Perlindungan tambahan (opsional)

Untuk lapisan keamanan kedua sebelum halaman login muncul, pasang **Cloudflare Access** (gratis sampai 50 user): Zero Trust → Access → Applications → Add application → Self-hosted → domain `leads.bilderlabs.com` → policy *Allow* untuk email Anda dan Andre. Setelah itu dashboard hanya bisa dibuka setelah memasukkan kode yang dikirim ke email tersebut.

## Jalankan di laptop (development)

```bash
npm run db:migrate:local
npm run db:seed:local
npm run user:add -- bagus "Bagus" --local
npm run dev            # http://localhost:8787
```

Database lokal tersimpan di folder `.wrangler/` dan terpisah dari database di Cloudflare.

## Cara kerja penyimpanan

- Setiap klik (Terkirim, Membalas, Won, dan lain-lain) langsung dikirim ke server. Indikator di kiri bawah menunjukkan "Tersinkron", "Menyimpan…", atau "Offline".
- Kalau koneksi putus, perubahan ditahan di browser dan dikirim ulang otomatis.
- Dashboard mengambil perubahan dari rekan setiap 20 detik dan setiap kali tab dibuka lagi.
- Kalau dua orang mengubah lead yang sama di waktu bersamaan, yang kedua mendapat pemberitahuan dan data terbaru dimuat ulang, jadi tidak ada yang tertimpa diam-diam.

## Masalah umum

| Pesan | Penyebab & solusi |
| --- | --- |
| `database_id … GANTI_DENGAN_DATABASE_ID` / database tidak ditemukan | Langkah 2 belum selesai: tempel `database_id` di `wrangler.jsonc`. |
| Error soal zone / domain `bilderlabs.com` tidak ditemukan | Wrangler login ke akun yang salah. Cek `npx wrangler whoami`, atau isi `account_id`. |
| Error custom domain karena DNS record sudah ada | Hapus record `leads` yang lama di DNS bilderlabs.com, atau pakai nama subdomain lain. |
| `Username atau password salah` padahal benar | User dibuat di database lokal (`--local`). Ulangi `npm run user:add` tanpa `--local`. |
| `Terlalu banyak percobaan` | 10 kali salah password dalam 15 menit. Tunggu 15 menit. |
