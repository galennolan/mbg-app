# Design Tokens & Micro-Animation Guide

Dokumen ini menjelaskan arsitektur **Design Tokens** (`src/lib/design-tokens.ts` & `tailwind.config.js`) yang menjadi fondasi visual **MBG Tracker (Nutri Kampus Hub)**.

---

## 1. Palet Warna & Kontras (WCAG AA)

Seluruh pasangan warna teks dan latar telah diverifikasi memenuhi rasio kontras WCAG AA (`>= 4.5:1` untuk teks normal, `>= 3:1` untuk teks besar dan komponen UI):

| Token | Nilai Hex | Penggunaan Utama |
|---|---|---|
| `brand-navy` | `#0B1220` | Header utama, bilah aksi sticky bawah, teks judul kontras tinggi |
| `brand-blue` | `#1D4ED8` | Aksi utama (Primary CTA), fokus input, indikator aktif |
| `brand-blue-700` | `#1E40AF` | State hover tombol utama |
| `brand-red` | `#DC2626` | Aksi destruktif, penolakan QC (RETUR), peringatan kritis |
| `surface.background` | `#F8FAFC` | Latar belakang utama halaman (`slate-50`) |
| `surface.card` | `#FFFFFF` | Permukaan kartu solid bebas blur untuk performa scroll 60fps |

---

## 2. Skala Z-Index Terstandarisasi

Tidak diperbolehkan menggunakan nilai z-index sembarang seperti `z-[9999]` atau `z-[200]`. Gunakan kelas Tailwind berbasis token berikut:

| Kelas Tailwind | Nilai Z-Index | Peruntukan |
|---|---|---|
| `z-base` | `0` | Elemen dasar halaman |
| `z-sticky` | `10` | Bilah aksi mengambang di bagian bawah halaman |
| `z-dropdown` | `20` | Menu dropdown `Select` combobox dan menu profil |
| `z-bottom-nav` | `30` | Navigasi bawah khusus tampilan smartphone (`BottomNavigation`) |
| `z-navbar` | `40` | Bilah navigasi atas (`Navbar`) |
| `z-modal` | `50` | Backdrop dan jendela `Modal` standar |
| `z-toast` | `60` | Tumpukan notifikasi `Toast` |
| `z-sweetalert` | `70` | Dialog interaktif `SweetAlert` (prioritas tertinggi) |

---

## 3. Animasi Mikro Ramah Smartphone

Seluruh animasi mikro dirancang hanya menganimasikan properti komposit GPU (`transform` dan `opacity`) dengan durasi singkat (`150ms–220ms`) dan otomatis menghormati preferensi sistem `@media (prefers-reduced-motion: reduce)`:

- **`.micro-tap`**: Efek tekan taktil `active:scale-[0.98]` pada tombol dan elemen interaktif.
- **`.micro-card`**: Permukaan kartu solid (`bg-white border border-slate-200 shadow-card`) dengan transisi bayangan halus saat diarahkan kursor di layar desktop.
- **`animate-sheet-up`**: Transisi modal dari bawah layar khusus perangkat smartphone (`cubic-bezier(0.22, 1, 0.36, 1)`).
- **`animate-pop-in`**: Transisi kemunculan dialog `SweetAlert` dan modal desktop.
- **`animate-svg-draw`**: Efek gambar garis vektor pada ikon status `SweetAlert`.
- **`animate-shake-error`**: Getaran horizontal singkat saat formulir mengalami kesalahan validasi.

