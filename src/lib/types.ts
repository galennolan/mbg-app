export type UserRole = 'admin' | 'guru';

export interface Pengguna {
  id: string;
  nama: string;
  email: string;
  peran: UserRole;
  status_aktif: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: 'X' | 'XI' | 'XII';
  jurusan: string;
  status_aktif: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface Siswa {
  id: string;
  nisn: string | null;
  nama: string;
  kelas_id: string;
  email: string | null;
  no_hp: string | null;
  status_aktif: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
  // Joined field
  kelas?: Kelas;
}

export type DistribusiStatus = 'menunggu' | 'tiba' | 'ditutup';

export interface DistribusiMBG {
  id: string;
  tanggal: string; // YYYY-MM-DD
  status: DistribusiStatus;
  waktu_kedatangan: string | null;
  waktu_input: string | null;
  petugas_id: string | null;
  keterangan: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  petugas?: Pengguna;
}

export type StatusPenerimaan = 'diterima' | 'tidak_hadir' | 'tidak_mengambil';
export type SumberPencatatan = 'siswa' | 'guru';

export interface PenerimaanMBG {
  id: string;
  distribusi_id: string;
  siswa_id: string;
  nama_siswa: string;
  nisn: string | null;
  kelas: string;
  jurusan: string;
  status_penerimaan: StatusPenerimaan;
  waktu_penerimaan: string | null;
  sumber_pencatatan: SumberPencatatan;
  petugas_id: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  petugas?: Pengguna;
}

export interface RiwayatAktivitas {
  id: string;
  pengguna_id: string | null;
  aktivitas: string;
  tabel_terkait: string;
  data_id: string | null;
  data_sebelum: any | null;
  data_sesudah: any | null;
  waktu_aktivitas: string;
  pengguna?: Pengguna;
}

