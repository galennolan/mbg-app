# DESIGN BRIEF (DBD)

**Nama Produk:** Nutri Kampus Hub (MBG & Smart EdTech CRM)
**Versi:** 1.0 (Visual Identity & Design Tokens)
**Konsep Visual:** Modern Glassmorphism (Playful yet Professional)
**Identitas Brand:** Universitas Bina Sarana Informatika (UBSI)

---

## 1. Filosofi Desain
Aplikasi ini menggabungkan kepercayaan institusi (UBSI Royal Blue) dengan fleksibilitas teknologi modern untuk Gen Z. Penggunaan **Glassmorphism** memberikan kesan transparan, bersih, dan futuristik, sementara skema warna merah-biru menjaga konsistensi dengan identitas kampus UBSI.

---

## 2. Design Tokens (Pembaruan Berdasarkan Identitas UBSI)

| Kategori Token | Nama Token | Nilai Hex / Properti | Kelas Tailwind (v4 Ready) | Penggunaan |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Base** | BSI Royal Blue | `#1E3A8A` | `bg-blue-900` | Latar belakang App Shell, Navbar, Header. |
| **Secondary Brand** | BSI Light Cyan | `#A5F3FC` | `bg-sky-100` | Aksen elemen sekunder, badge, highlight. |
| **Accent / CTA** | BSI Crimson Red | `#DC2626` | `bg-red-600` | Tombol Smart Banner, Konfirmasi Utama. |
| **Background Mesh** | BSI Deep Gradient | `#0F172A` to `#1E3A8A` | `bg-gradient-to-br` | Latar belakang utama PWA. |
| **Glass Surface** | Frosted Glass Light | `rgba(255,255,255,0.12)` | `bg-white/12 blur-xl` | Kartu rekap, form, daftar siswa. |
| **Glass Dark** | Frosted Glass Dark | `rgba(15,23,42,0.70)` | `bg-slate-900/70` | Panel modal, dialog, kontainer tabel. |
| **Typography 1** | Pure White | `#FFFFFF` | `text-white` | Judul dan teks utama. |
| **Typography 2** | Muted Sky | `#BAE6FD` | `text-sky-200` | Label form, keterangan waktu. |
| **Status Success** | Mint Green | `#10B981` | `text-emerald-400` | Status "Layak Edar", "Hadir". |
| **Status Danger** | Alert Rose | `#F43F5E` | `text-rose-400` | Status "Tolak/Retur", "Alergi". |

---

## 3. Implementasi Komponen UI

### 3.1 App Header (Nuansa Biru UBSI)
```tsx
export function BsiAppHeader() {
  return (
    <header className="w-full py-4 px-6 bg-blue-950/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center border border-white/20 shadow-inner">
          <span className="text-white font-bold text-lg">BSI</span>
        </div>
        <div>
          <h1 className="text-white font-bold text-sm tracking-wide">NUTRI KAMPUS HUB</h1>
          <p className="text-sky-200 text-xs">Universitas Bina Sarana Informatika</p>
        </div>
      </div>
    </header>
  );
}
```

### 3.2 Tombol Aksi Utama (Gradient Blue & Indigo)
```tsx
export function BsiPrimaryButton({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-semibold shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 active:scale-[0.98] transition-all duration-200 border border-white/20 backdrop-blur-md"
    >
      {label}
    </button>
  );
}
```

### 3.3 Smart Banner CTA (Crimson Red)
Digunakan khusus untuk kampanye PMB/Beasiswa UBSI guna menarik perhatian secara visual (High Contrast).
- **Background:** `bg-red-600`
- **Hover:** `hover:bg-red-700`
- **Shadow:** `shadow-red-900/20`

---

## 4. Efek Visual & Tipografi
- **Blur Strength:** Standar `backdrop-blur-xl` (16px - 24px) untuk semua elemen Glassmorphism.
- **Border:** Tipis (`1px`) dengan opasitas rendah (`border-white/20`) untuk mempertegas batas kartu tanpa terlihat kaku.
- **Font:** Diutamakan menggunakan font sans-serif modern seperti *Inter* atau *Plus Jakarta Sans*.

---

## 5. Panduan Print (Export)
Saat mencetak laporan PDF:
- Hilangkan efek blur dan gradien.
- Gunakan latar belakang putih (`bg-white`) dan teks hitam (`text-black`).
- Gunakan border solid `1px` untuk tabel laporan resmi.
