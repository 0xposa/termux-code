# Termux Code ⚡

> **Modern Lightweight IDE & Native Terminal for Android via Termux**  
> Dirancang khusus untuk memprogram, mengedit kode, dan menjalankan **AI Agent CLI** (`antigravity-cli`, `claude`, `aider`, `opencode`, dll.) secara nyaman langsung di perangkat Android.

---

## 🌟 Tentang Termux Code

**Termux Code** adalah *all-in-one development environment* yang berjalan secara lokal di Android melalui Termux. Menggabungkan editor kode multi-bahasa yang cepat (**CodeMirror 6**), emulator terminal berbasis hardware (**xterm.js**) yang terhubung langsung ke **Linux Pseudo-Terminal (PTY)** shell Termux asli, serta bilah input pintar (*chat-style multiline input*) yang dirancang khusus untuk kenyamanan layar sentuh HP dan keyboard fisik.

---

## 🏗️ Bagaimana Aplikasinya Bekerja?

Termux Code dibangun dengan arsitektur **Hybrid Client-Server** yang sangat ringan dan efisien:

```mermaid
flowchart TD
    subgraph Browser_App["Frontend (Web UI / Android WebView)"]
        UI["Antarmuka Web (HTML5 & CSS3)"]
        XTERM["xterm.js Terminal Emulator"]
        CM["CodeMirror 6 Code Editor"]
        CHAT["Smart Multiline Input Bar"]
    end

    subgraph Server_Backend["Backend (Python 3 / FastAPI)"]
        FASTAPI["FastAPI Server (Port 8088)"]
        WS_HANDLER["WebSocket Terminal Bridge"]
        FILE_API["File Manager REST API"]
        PTY_ENGINE["PTY Process Engine"]
    end

    subgraph OS_Termux["Termux Environment (Android Linux)"]
        PTY_DEV["/dev/pts (Linux Pseudo-Terminal)"]
        BASH["Bash Shell / CLI Tools"]
        PROC["/proc/<pid>/cwd (Tracking Direktori)"]
        FS["Termux Filesystem ($HOME)"]
    end

    UI --> XTERM
    UI --> CM
    UI --> CHAT
    
    CHAT -- "Atomic Bracketed Paste (\x1b[200~...\x1b[201~)" --> WS_HANDLER
    XTERM <--> |"WebSocket Bi-Directional Stream"| WS_HANDLER
    CM <--> |"REST API (Save, Read, Diff)"| FILE_API
    
    WS_HANDLER <--> PTY_ENGINE
    PTY_ENGINE <--> PTY_DEV
    PTY_DEV <--> BASH
    PTY_ENGINE -.-> |"Cek perubahan direktori (cd)"| PROC
    FILE_API <--> FS
```

### 1. Sisi Backend (Python 3 + FastAPI)
- **Linux Pseudo-Terminal (PTY) Engine (`server/pty_manager.py`):**
  Menggunakan pustaka sistem Linux bawaan Python (`pty`, `termios`, `fcntl`, `subprocess`) untuk membuka saluran master/slave PTY. Shell yang dijalankan adalah shell bash Termux asli (`/data/data/com.termux/files/usr/bin/bash -l`), sehingga seluruh binary, PATH, environment variables, alias, package Python, dan Node.js Anda tersedia sepenuhnya.
- **Bi-Directional WebSocket Bridge (`server/main.py`):**
  Endpoint `/ws/terminal` membaca output PTY secara non-blocking dan mengalirkannya secara *real-time* ke browser via WebSocket dengan latensi sangat rendah.
- **Dynamic CWD Tracking:**
  Sistem secara berkala dan reaktif memeriksa direktori kerja proses shell (`/proc/<pid>/cwd`) setiap kali perintah seperti `cd` dijalankan, sehingga judul tab terminal dan scope file explorer selalu sinkron dengan direktori yang sedang dibuka.
- **File Manager API (`server/file_manager.py`):**
  Menyediakan endpoint RESTful untuk membaca hierarki folder (*file tree*), membaca/menyimpan konten file, membuat berkas/folder baru, upload berkas dari device Android, mengganti nama (*rename*), dan menghapus file secara aman.

### 2. Sisi Frontend (Vanilla JavaScript + Web Standards)
- **xterm.js Terminal:**
  Menggunakan `xterm.js` dengan konfigurasi ANSI PTY yang presisi (`convertEol: false`) untuk mendukung rendering warna Truecolor 24-bit, styling teks CLI, dan grafik TUI/pixel art yang akurat (seperti logo Antigravity CLI).
- **CodeMirror 6 Editor:**
  Editor kode modern yang di-bundle menggunakan esbuild, mendukung *syntax highlighting* untuk Python, JavaScript, TypeScript, HTML, CSS, JSON, Markdown, dan Bash dengan tema One Dark yang nyaman di mata.
- **Smart Multiline Input / Chat Bar:**
  Kolom perintah di bagian bawah dirancang layaknya aplikasi chat modern (WhatsApp / ChatGPT):
  - Teks panjang otomatis membungkus ke bawah (*word wrap*) dan tinggi kolom membesar secara otomatis (*auto-expand* hingga 140px).
  - Mendukung baris baru dengan **Shift + Enter**.
  - **Proteksi Keyboard Virtual:** Menekan tombol baris baru (↵) pada keyboard virtual HP (Gboard, Samsung, dll.) tidak akan mengirim pesan sebelum tombol **Kirim** ditekan.
  - **Atomic Bracketed Paste Mode:** Teks multi-baris dikirim ke terminal menggunakan protokol *Bracketed Paste* (`\x1b[200~` ... `\x1b[201~`), memastikan seluruh kalimat terkirim secara bersamaan tanpa terpotong atau dieksekusi per baris.

---

## ✨ Fitur Unggulan

- 💻 **Real Native Termux Shell**: Bukan sekadar simulasi web; ini adalah terminal bash Termux asli dengan hak akses penuh ke penyimpanan Termux Anda.
- 🔄 **Multi-Session Tabs**: Buka banyak tab terminal secara bersamaan (`+`), ganti nama sesi, dan tutup sesi dengan mudah.
- ⌨️ **Mobile Virtual Key Toolbar**: Bilah tombol praktis untuk navigasi di HP: `ESC`, `TAB`, `CTRL`, `ALT`, `^C`, `^D`, tombol panah `↑ ↓ ← →`, `~`, `/`, `|`, `-`, `_`.
- 📎 **File Attachment Dropdown**: Sisipkan path file langsung ke terminal, baik dari berkas proyek yang sedang aktif maupun upload langsung dari galeri/penyimpanan perangkat.
- 📱 **Split-Screen & Responsive Drawer**: Tampilan split editor dan terminal yang bisa digeser ukurannya (*panel resizer*), atau beralih ke mode fokus: *Editor Only* atau *Terminal Only*.
- 🤖 **Cocok untuk AI Agent CLIs**: Optimal untuk menjalankan CLI seperti `antigravity-cli`, `claude`, `aider`, `opencode`, dan alat CLI lainnya.

---

## 🚀 Cara Instalasi & Menjalankan

### Persyaratan:
- Perangkat Android dengan aplikasi **Termux** terpasang.
- Python 3 (`pkg install python -y`).

### Langkah-langkah:
1. **Clone repository ini:**
   ```bash
   git clone https://github.com/0xposa/termux-code.git
   cd termux-code
   ```

2. **Jalankan aplikasi:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
   *Skrip `start.sh` akan secara otomatis memeriksa dan menginstal dependensi Python (`fastapi`, `uvicorn`, `pydantic`) yang diperlukan.*

3. **Buka di Browser:**
   Akses antarmuka web melalui browser HP Anda (Brave, Chrome, Firefox, dll.):
   👉 **`http://localhost:8088`**

> [!TIP]
> Untuk pengalaman aplikasi layar penuh (*fullscreen app*), Anda bisa memilih opsi **"Add to Home screen"** / **"Install app"** di menu browser Android Anda (PWA ready).

---

## 📱 Membangun Aplikasi Android Standalone (APK)

Termux Code juga menyertakan proyek Android Studio lengkap di folder `android/`:

- **Di PC/Laptop (Android Studio):**
  Buka folder `android/` di Android Studio, lalu lakukan **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
- **Langsung di Termux:**
  ```bash
  pkg install openjdk-17 gradle -y
  cd android
  chmod +x build-apk.sh
  ./build-apk.sh
  ```

---

## 📁 Struktur Direktori

```text
termux-code/
├── android/                   # Proyek Android Studio (Native WebView Wrapper)
│   ├── app/
│   │   ├── src/main/java/     # MainActivity (WebView controller)
│   │   ├── src/main/assets/   # Bundled assets web offline
│   │   └── build.gradle.kts   # Gradle configuration
│   └── build-apk.sh           # Skrip otomatisasi build APK
├── server/                    # Python Backend
│   ├── main.py                # Server FastAPI & WebSocket bridge
│   ├── pty_manager.py         # Engine PTY Unix & CWD process inspector
│   └── file_manager.py        # REST API untuk operasi file explorer
├── web/                       # Frontend Web UI
│   ├── index.html             # Struktur antarmuka web
│   ├── styles.css             # Desain tema One Dark & responsif mobile
│   ├── app.js                 # Logika interaktif, WebSocket, & Terminal input
│   └── vendor/                # Bundle xterm.js dan CodeMirror 6
├── tests/                     # Unit tests backend
│   └── test_backend.py        # Verifikasi PTY, File CRUD, & Endpoint
├── .gitignore                 # Filter berkas build & dependensi
├── package.json               # Konfigurasi bundler CodeMirror (esbuild)
├── start.sh                   # Skrip peluncur instan satu klik
└── README.md                  # Dokumentasi lengkap
```

---

## 🧪 Menjalankan Pengujian (Tests)

Proyek ini dilengkapi dengan unit test untuk memverifikasi fungsionalitas PTY dan operasi file:

```bash
python3 -m unittest discover tests
```

---

## 📄 Lisensi

Didistribusikan di bawah lisensi [ISC](LICENSE). Silakan gunakan, modifikasi, dan kembangkan sesuai kebutuhan Anda.
