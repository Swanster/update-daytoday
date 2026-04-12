# Panduan Setup Google Sheets API untuk Briefing Infra

## 📋 Overview
Tab "Briefing Infra" terintegrasi dengan Google Sheets untuk sinkronisasi data briefing infrastruktur. Untuk mengaktifkan fitur sync, Anda perlu setup Google Cloud Project dan Service Account.

---

## 🚀 Langkah Setup

### 1. Buat Google Cloud Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **"Select a Project"** di header atas
3. Klik **"New Project"**
4. Beri nama project (misal: `briefing-infra-sync`)
5. Klik **"Create"**

---

### 2. Enable Google Sheets API

1. Di Google Cloud Console, buka **"APIs & Services"** > **"Library"**
2. Search untuk **"Google Sheets API"**
3. Klik pada result "Google Sheets API"
4. Klik tombol **"Enable"**
5. Tunggu sampai API aktif (biasanya beberapa detik)

---

### 3. Buat Service Account Credentials

1. Buka **"APIs & Services"** > **"Credentials"**
2. Klik **"+ CREATE CREDENTIALS"** di atas
3. Pilih **"Service Account"**
4. Isi form:
   - **Service account name**: `briefing-sync-sa`
   - **Service account ID**: akan auto-generate
   - **Description**: `Service account for briefing infra sync`
5. Klik **"Create and Continue"**
6. Di step "Grant this service account access to project":
   - **Role**: Pilih **"Basic"** > **"Viewer"** (atau "Editor" jika ingin write access)
   - Atau bisa skip untuk sekarang
7. Klik **"Done"**

---

### 4. Generate Key File (JSON)

1. Di daftar Service Accounts, klik service account yang baru dibuat (`briefing-sync-sa@...`)
2. Pergi ke tab **"Keys"**
3. Klik **"Add Key"** > **"Create new key"**
4. Pilih **"JSON"** sebagai key type
5. Klik **"Create"**
6. File JSON akan otomatis terdownload (nama file seperti `your-project-12345-abc123.json`)

---

### 5. Install Dependencies

Di folder `server/`, install package googleapis:

```bash
cd /home/swanster/project6661/project-01/server
npm install
```

Ini akan menginstall `googleapis` yang sudah ditambahkan di package.json.

---

### 6. Setup Credentials di Server

1. Buat folder `config` di dalam `server/` (jika belum ada):

```bash
mkdir -p /home/swanster/project6661/project-01/server/config
```

2. **Rename** file JSON yang didownload dari Google Cloud menjadi `google-credentials.json`

3. **Copy** file tersebut ke folder `server/config/`:

```bash
cp /path/to/downloaded/file.json /home/swanster/project6661/project-01/server/config/google-credentials.json
```

**ATAU** Anda bisa paste isi JSON-nya langsung:

Buat file baru di `server/config/google-credentials.json` dengan isi dari JSON yang didownload.

---

### 7. Share Google Sheet ke Service Account

1. Buka file JSON credentials, cari field `"client_email"` (contoh: `briefing-sync-sa@your-project.iam.gserviceaccount.com`)

2. Buka Google Sheet Anda: 
   ```
   https://docs.google.com/spreadsheets/d/1q6sJ419VFrkVQSFGlqypEFHvjTQPMBjqouIUriF571o/edit
   ```

3. Klik tombol **"Share"** di pojok kanan atas

4. Di field "Add people and groups", paste **email service account** dari step 1

5. Pilih permission: **"Editor"** (penting! agar bisa write balik ke sheet)

6. **Uncheck** "Notify people" (tidak perlu notifikasi)

7. Klik **"Share"** atau **"Send"**

---

### 8. Set Environment Variables

Tambahkan ke file `.env` di root project atau di environment server:

```env
# Google Sheets Configuration
GOOGLE_SHEET_ID=1q6sJ419VFrkVQSFGlqypEFHvjTQPMBjqouIUriF571o
```

**Catatan**: Sheet ID sudah di-set default ke sheet Anda (`1q6sJ419VFrkVQSFGlqypEFHvjTQPMBjqouIUriF571o`), tapi bisa diubah jika perlu.

---

### 9. Verifikasi Setup

1. **Start server**:

```bash
cd /home/swanster/project6661/project-01/server
npm start
```

Anda harus melihat log:
```
✅ Google Sheets API initialized successfully
```

2. **Login ke aplikasi web**

3. **Buka tab "📝 Briefing Infra"**

4. **Klik tombol "📥 Sync From Sheet"** di header

5. Jika berhasil, akan muncul toast notification:
   ```
   Sync completed: X created, Y updated, Z skipped
   ```

6. **Data dari Google Sheet** akan muncul di tabel

---

## 🔄 Cara Menggunakan Sync

### Sync From Sheet (Google Sheet → MongoDB)
- Mengambil data terbaru dari Google Sheet
- Membuat entry baru jika belum ada di MongoDB
- Update entry yang sudah ada (berdasarkan tanggal + lokasi + pekerjaan)
- Data yang di-sheet tapi tidak ada di MongoDB akan dibuat baru

**Kapan pakai**: 
- Saat pertama kali setup
- Setelah ada perubahan manual di Google Sheet
- Untuk backup data dari Sheet ke database

### Sync To Sheet (MongoDB → Google Sheet)
- Mengirim semua data dari MongoDB ke Google Sheet
- **MENIMPA** seluruh isi sheet (clear & write ulang)
- Baris pertama akan jadi header otomatis

**Kapan pakai**:
- Setelah input/edit data dari web
- Untuk backup database ke Sheet
- Saat ingin consolidate semua perubahan ke Sheet

---

## 📊 Struktur Kolom di Google Sheet

Pastikan sheet Anda memiliki kolom berikut di baris pertama (header):

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| **Tanggal** | **Lokasi / Site** | **Pekerjaan** | **PIC** | **Status** | **Checklist** | **Catatan** |

**Format Tanggal**: `YYYY-MM-DD` (contoh: `2026-04-12`)

**Status Options**: `Pending`, `Progress`, `Done`, `Hold`

---

## ⚠️ Troubleshooting

### Error: "Google credentials file not found"
**Solusi**: Pastikan file `google-credentials.json` ada di `server/config/`

### Error: "The caller does not have permission"
**Solusi**: 
- Pastikan Service Account sudah di-**share** ke Google Sheet dengan role **Editor**
- Cek email service account di JSON file field `client_email`

### Error: "Sheet not found"
**Solusi**: 
- Pastikan Sheet ID di `.env` benar
- Sheet harus memiliki nama default "Sheet1" atau ubah `SHEET_RANGE` di `server/routes/briefings.js`

### Sync berhasil tapi data tidak muncul
**Solusi**:
- Cek format tanggal di Sheet (harus valid, bisa diparse)
- Baris kosong akan di-skip otomatis
- Refresh halaman web setelah sync

### Build error: "googleapis not found"
**Solusi**: 
```bash
cd /home/swanster/project6661/project-01/server
npm install
```

---

## 🔐 Keamanan

**PENTING**: 
- File `google-credentials.json` berisi credentials sensitif
- **JANGAN** commit ke Git (sudah ada di `.gitignore`?)
- Di production, gunakan environment variables atau secret manager
- Batasi akses Service Account hanya ke sheet yang diperlukan

Tambahkan ke `.gitignore` di root project:
```
server/config/google-credentials.json
```

---

## 📝 Catatan Tambahan

- **Access Level**: Tab Briefing Infra bisa diakses **semua user** yang login (bukan hanya admin)
- **Edit Access**: Semua user bisa add/edit/delete briefing
- **Sync Access**: Tombol sync terlihat semua user, tapi idealnya hanya untuk admin (bisa dibatasi kemudian jika perlu)

---

## ✅ Checklist Setup

- [ ] Google Cloud Project dibuat
- [ ] Google Sheets API enabled
- [ ] Service Account dibuat
- [ ] JSON key file didownload
- [ ] Dependencies installed (`npm install` di server)
- [ ] File `google-credentials.json` ditaruh di `server/config/`
- [ ] Google Sheet di-share ke email Service Account (sebagai Editor)
- [ ] Environment variable `GOOGLE_SHEET_ID` diset
- [ ] Server restarted
- [ ] Test sync from sheet berhasil
- [ ] Test sync to sheet berhasil
- [ ] File credentials ditambahkan ke `.gitignore`

---

Jika ada pertanyaan atau masalah, silakan tanyakan! 😊
