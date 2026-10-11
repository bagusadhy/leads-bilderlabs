# Bilder Leads (Bilderlabs Dashboard)

CRM outreach untuk Bilder Labs. Dashboard ini menyusun pekerjaan harian (cek inbox, balas, follow-up, Email 1 baru, mock-up), menyimpan status setiap lead di MySQL, dan bisa dipakai berdua (Bagus & Andre) dari laptop atau HP.

- **Server:** Node.js 22 + [Hono](https://hono.dev) (ringan, satu container, ±60 MB RAM)
- **Database:** MySQL 8 atau MariaDB 10.6+ (pakai container MySQL yang sudah ada di VPS)
- **Frontend:** HTML + CSS + JavaScript biasa, tanpa build step
- **Login:** username + password per orang, sesi 30 hari, setiap perubahan tercatat siapa yang melakukannya

## Isi dashboard

| Halaman | Fungsi |
| --- | --- |
| Hari ini | Checklist berurutan: cek inbox → balas → follow-up → Email 1 baru → mock-up → tutup sequence → hubungi lagi. Ada jam kirim per zona waktu (dalam WIB). |
| Mode kirim | Email muncul satu per satu: salin alamat, subjek, isi, lalu "Terkirim, lanjut". Tanggal follow-up langsung terjadwal. |
| Leads | Tab per status (Perlu tindakan, Belum dihubungi, Cari email, Dalam sequence, Respons, Ditunda, Won, Lost) dengan tampilan List atau Kartu. |
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
│   ├── server.js      # API + file statis
│   ├── db.js          # koneksi MySQL + migrasi
│   ├── leads.js       # validasi & query lead
│   ├── auth.js        # hash password (scrypt) & token sesi
│   ├── cli.js         # perintah: migrate, seed, user:add, …
│   └── config.js      # baca .env
├── public/            # tampilan dashboard (index.html, login.html, app.js, app.css)
├── migrations/        # skema database (otomatis dijalankan saat start)
├── data/
│   ├── seed.json      # 102 lead dari sheet 8 Okt + template email
│   └── default-settings.json
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Deploy ke VPS

### 1. Salin project ke VPS

Pakai git (disarankan) atau `scp`:

```bash
scp -r "Bilderlabs Dashboard" user@vps:~/bilderlabs-dashboard
ssh user@vps
cd ~/bilderlabs-dashboard
```

### 2. Cari container MySQL dan network-nya

```bash
docker ps --format '{{.Names}}\t{{.Image}}' | grep -iE 'mysql|maria'
docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' NAMA_CONTAINER_MYSQL
```

Catat nama container (untuk `DB_HOST`) dan nama network (untuk `DB_NETWORK`).

Kalau network-nya cuma `bridge` (network bawaan Docker), nama container tidak bisa dipakai sebagai alamat. Buat network baru lalu sambungkan MySQL ke sana:

```bash
docker network create mysql_net
docker network connect mysql_net NAMA_CONTAINER_MYSQL
# lalu di .env: DB_NETWORK=mysql_net dan DB_HOST=NAMA_CONTAINER_MYSQL
```

### 3. Buat database dan user khusus

```bash
docker exec -it NAMA_CONTAINER_MYSQL mysql -uroot -p
```

```sql
CREATE DATABASE bilder_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bilder'@'%' IDENTIFIED BY 'password-yang-kuat';
GRANT ALL PRIVILEGES ON bilder_dashboard.* TO 'bilder'@'%';
FLUSH PRIVILEGES;
```

### 4. Isi `.env`

```bash
cp .env.example .env
nano .env   # isi DB_NETWORK, DB_HOST, DB_PASSWORD
```

### 5. Jalankan

```bash
docker compose up -d --build
docker compose logs -f app    # tunggu "Bilder Leads berjalan di http://localhost:3000"
```

Tabel database dibuat otomatis saat container start.

### 6. Masukkan data awal dan buat user login

```bash
docker compose exec app node src/cli.js seed data/seed.json
docker compose exec -it app node src/cli.js user:add bagus "Bagus"
docker compose exec -it app node src/cli.js user:add andre "Andre"
```

Password diminta saat perintah dijalankan (minimal 10 karakter, tidak tampil di layar).

### 7. Buka dashboard

Secara default dashboard hanya mendengarkan di `127.0.0.1:3000` di VPS, jadi tidak langsung terbuka ke internet. Pilih salah satu:

- **SSH tunnel (paling cepat untuk coba):** di laptop jalankan `ssh -L 3000:127.0.0.1:3000 user@vps`, lalu buka http://localhost:3000
- **Tailscale:** set `APP_BIND=0.0.0.0` dan buka `http://IP-tailscale-vps:3000`. Pastikan firewall VPS tidak membuka port 3000 ke publik.
- **Domain + HTTPS (Caddy):**

  ```
  leads.bilderlabs.com {
      reverse_proxy 127.0.0.1:3000
  }
  ```

  Lalu di `.env`: `COOKIE_SECURE=true` dan `TRUST_PROXY=true`, kemudian `docker compose up -d`.
- **Cloudflare Tunnel:** arahkan ke `http://localhost:3000`, set `COOKIE_SECURE=true` dan `TRUST_PROXY=true`.

## Perintah sehari-hari

```bash
# Update setelah ada perubahan kode
git pull && docker compose up -d --build

# Lihat log
docker compose logs -f app

# User
docker compose exec -it app node src/cli.js user:list
docker compose exec -it app node src/cli.js user:password bagus

# Backup database (simpan di luar VPS juga)
docker exec NAMA_CONTAINER_MYSQL mysqldump -uroot -p'PASSWORD_ROOT' bilder_dashboard > bilder-$(date +%F).sql

# Restore
docker exec -i NAMA_CONTAINER_MYSQL mysql -uroot -p'PASSWORD_ROOT' bilder_dashboard < bilder-2026-10-09.sql
```

Selain itu, menu **Import / export → Cadangan JSON** mengunduh semua data dari browser.

## Menambah lead baru

1. **Lewat dashboard:** Import / export → taruh file CSV. Kolomnya: `business, country, city, niche, phone, email, email_confidence, email_source, contact_name, rating, reviews, score, website_check, personal_hook, facebook, maps_url, subject_1, email_1, subject_2, email_2, subject_3, email_3, stage, notes`. Yang wajib hanya `business` dan `country` (AU/US).
2. **Lewat API (untuk n8n atau skrip):** isi `API_TOKEN` di `.env`, restart, lalu:

   ```bash
   curl -X POST https://leads.bilderlabs.com/api/leads/import \
     -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"leads":[{"business":"Example Plumbing","country":"US","city":"Austin TX","niche":"Plumber","email":"info@example.com"}]}'
   ```

   Duplikat (email, telepon, atau nama + kota sama) dan alamat di daftar jangan dihubungi otomatis dilewati.

## Jalankan di laptop (development)

Butuh Node.js 22+ dan akses ke MySQL (misalnya lewat SSH tunnel ke VPS: `ssh -L 3307:IP_CONTAINER_MYSQL:3306 user@vps`).

```bash
npm install
cp .env.example .env   # DB_HOST=127.0.0.1, DB_PORT=3307
npm run seed
npm run user:add -- bagus "Bagus"
npm run dev            # http://localhost:3000
```

## Cara kerja penyimpanan

- Setiap klik (Terkirim, Membalas, Won, dan lain-lain) langsung dikirim ke server. Indikator di kiri bawah menunjukkan "Tersinkron", "Menyimpan…", atau "Offline".
- Kalau koneksi putus, perubahan ditahan di browser dan dikirim ulang otomatis.
- Dashboard mengambil perubahan dari rekan setiap 20 detik dan setiap kali tab dibuka lagi.
- Kalau dua orang mengubah lead yang sama di waktu bersamaan, yang kedua mendapat pemberitahuan dan data terbaru dimuat ulang, jadi tidak ada yang tertimpa diam-diam.

## Masalah umum

| Pesan | Penyebab & solusi |
| --- | --- |
| `network mysql_default declared as external, but could not be found` | `DB_NETWORK` di `.env` salah. Ulangi langkah 2. |
| `Database belum siap (ECONNREFUSED / ENOTFOUND)` | `DB_HOST` salah atau container MySQL tidak satu network dengan dashboard. |
| `ER_ACCESS_DENIED_ERROR` | User/password MySQL salah, atau user dibuat untuk `'localhost'`, bukan `'%'`. |
| Login berhasil tapi langsung keluar lagi | Dibuka lewat `http://` sementara `COOKIE_SECURE=true`. Pakai HTTPS atau set `false`. |
