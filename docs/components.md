# UI Component Library & Notification Reference

Dokumen ini merupakan panduan resmi penggunaan komponen UI terstandarisasi pada **MBG Tracker (Nutri Kampus Hub)**. Seluruh komponen telah memenuhi standar WCAG 2.1 AA, target sentuh ramah smartphone (`min-h-[44px]`), animasi mikro responsif (`150ms-220ms`), serta aturan anti-slop (`R-01` s/d `R-37`).

Semua komponen dapat di-import langsung dari barrel file `@/components/ui`:

```tsx
import {
  Button,
  Input,
  Select,
  Textarea,
  Checkbox,
  RadioGroup,
  Switch,
  DatePicker,
  Label,
  FieldError,
  FieldHelper,
  FormField,
  FormSection,
  FieldArray,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalConfirm,
  Alert,
  FeedbackBanner,
  ErrorSummary,
  PageHeader,
  useNotify,
  swal,
} from '@/components/ui';
```

---

## 1. Primitives (Atoms)

### `Input` (`src/components/ui/Input.tsx`)
Mendukung `forwardRef`, asosiasi `id` otomatis (`useId()`), `aria-invalid`, `aria-describedby` ke pesan error dan teks bantuan, serta ikon kiri/kanan.

```tsx
<Input
  label="Nama Petugas"
  required
  placeholder="Contoh: Budi Santoso"
  helperText="Sesuai SK Piket Sekolah"
  error={errors.nama}
  leftIcon={<Users className="w-4 h-4" />}
/>
```

### `Select` (`src/components/ui/Select.tsx`)
Custom Accessible Combobox yang menggantikan elemen `<select>` bawaan browser agar ramah tampilan mobile dan mendukung navigasi keyboard penuh (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`, `Home`, `End`), pencarian (`searchable`), dan hapus pilihan (`clearable`).

```tsx
<Select
  label="Pilih Kelas"
  required
  value={selectedClassId}
  onValueChange={(val) => setSelectedClassId(val)}
  searchable
  options={[
    { value: 'cls-1', label: 'XII RPL 1', description: '32 Siswa' },
    { value: 'cls-2', label: 'XII TKJ 1', description: '30 Siswa' },
  ]}
/>
```

### `Textarea` (`src/components/ui/Textarea.tsx`)
Mendukung `autoResize` berdasarkan tinggi konten serta batas `minRows` dan `maxRows`.

```tsx
<Textarea
  label="Catatan Temuan QC"
  rows={3}
  autoResize
  maxRows={8}
  error={errors.catatan}
/>
```

### `Checkbox`, `RadioGroup`, `Switch`, `DatePicker`
- **`Checkbox`**: Mendukung state `indeterminate`, animasi SVG check, serta `aria-describedby` untuk deskripsi dan error.
- **`RadioGroup`**: Menggunakan `<fieldset>` dan `<legend>` semantik dengan layout `vertical` atau `horizontal`.
- **`Switch`**: Menggunakan `role="switch"` dan `aria-checked` dengan transisi pendorong (`spring`) yang halus.
- **`DatePicker`**: Input tanggal dengan pratinjau format tanggal Bahasa Indonesia otomatis.

---

## 2. Compound Form Components (Molecules)

### `FormField`, `FormSection`, `FieldArray`
- **`FormField`**: Membungkus komponen input kustom dengan `Label`, `FieldHelper`, dan `FieldError`.
- **`FormSection`**: Mengelompokkan bagian formulir dengan judul, deskripsi, dan opsi `collapsible`.
- **`FieldArray`**: Mengelola daftar input dinamis (tambah, hapus, batas minimum/maksimum item).

---

## 3. Sistem Modal & Fokus (`src/components/ui/Modal.tsx`)

Komponen `Modal` menggunakan React Portal (`createPortal`), mengunci scroll halaman belakang, menjebak fokus keyboard (`Tab` / `Shift+Tab` focus trap), menutup dengan tombol `Escape`, serta mengembalikan fokus ke tombol pemicu saat modal ditutup.
- Di layar smartphone, modal muncul dari bawah (`animate-sheet-up`).
- Di layar desktop, modal muncul di tengah (`animate-pop-in`).

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Data Siswa"
  description="Perubahan akan langsung tercatat pada log audit."
  size="md"
>
  {/* Konten form */}
</Modal>
```

---

## 4. Sistem Notifikasi: SweetAlert & Toast (`useNotify`)

Aplikasi dilengkapi sistem notifikasi terpusat yang ringan (tanpa dependensi eksternal berat) melalui `NotificationProvider` (`src/components/ui/NotificationProvider.tsx`).

### Toast Ringan (Pojok Kanan Atas / Atas Mobile)
Memiliki progress bar hitung mundur yang otomatis berhenti sementara (`pause`) saat disentuh jari atau diarahkan kursor:

```tsx
const notify = useNotify();

notify.success('Data Tersimpan', 'Perubahan kelas berhasil diperbarui.');
notify.error('Gagal Menyimpan', 'Periksa kembali koneksi Anda.');
notify.warning('Perhatian', 'Pilih minimal 1 siswa yang hadir.');
notify.info('Informasi', 'Template Excel sedang diunduh.');
```

### Dialog SweetAlert Interaktif (`notify.fire` & `notify.confirm`)
Menampilkan dialog beranimasi mikro (`animate-pop-in`) dengan ikon SVG yang menggambar garisnya sendiri (`animate-svg-draw`):

```tsx
// 1. Dialog Informasi / Sukses / Peringatan
await notify.fire({
  icon: 'success',
  title: 'Sesi MBG Dibuka',
  text: 'Master QR & PIN Harian telah diterbitkan untuk perwakilan kelas.',
  badgeText: 'STATUS: LAYAK EDAR',
  details: [
    { label: 'Jam Tiba', value: '09:15 WIB' },
    { label: 'PIN Harian', value: '4829' },
  ],
});

// 2. Dialog Konfirmasi Aksi Destruktif (Promise<boolean>)
const confirmed = await notify.confirm({
  icon: 'warning',
  title: 'Hapus Campaign Ini?',
  text: 'Campaign yang dihapus tidak dapat dikembalikan.',
  confirmText: 'Ya, Hapus',
  cancelText: 'Batal',
  variant: 'danger',
});
if (confirmed) {
  // Eksekusi hapus
}
```

