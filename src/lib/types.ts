export type UserRole = 'super_admin' | 'guru_piket' | 'kepala_sekolah' | 'admin' | 'guru';

export interface School {
  id: string;
  npsn: string;
  nama_sekolah: string;
  nama_kepala_sekolah: string | null;
  nip_kepala_sekolah: string | null;
  nama_sppg_mitra: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface Pengguna {
  id: string;
  id_sekolah?: string | null;
  nama: string;
  email: string;
  peran: UserRole;
  status_aktif: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface Kelas {
  id: string;
  id_sekolah?: string;
  nama_kelas: string;
  tingkat: string;
  jurusan: string;
  total_siswa_dapodik?: number;
  status_aktif?: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
}

export interface Siswa {
  nisn: string; // Primary Key (10 digits)
  id_kelas?: string;
  nama_lengkap: string;
  no_hp: string | null;
  email: string | null;
  jurusan: string | null;
  alergi_makanan: string | null;
  is_perwakilan_kelas: boolean;
  lead_score: number;
  lead_status: 'COLD' | 'WARM' | 'HOT';
  dibuat_pada: string;
  diperbarui_pada: string;
  id: string;
  nama: string;
  kelas_id: string;
  status_aktif: boolean;
  kelas?: Kelas;
}

export type DistribusiStatus = 'menunggu' | 'tiba' | 'ditutup';

export interface DistribusiMBG {
  id: string;
  tanggal: string;
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

export type OrganolepticKesimpulan = 'LAYAK_EDAR' | 'TOLAK_RETUR';

export interface OrganolepticTest {
  id: string;
  id_sekolah: string;
  id_guru_piket: string;
  tanggal: string;
  jam_tiba: string;
  master_qr_token: string;
  kode_pin_harian: string;
  status_ketepatan: 'TEPAT_WAKTU' | 'TERLAMBAT';
  status_aroma: string | null;
  status_rasa: string | null;
  status_tekstur: string | null;
  status_wadah: string | null;
  foto_sampel_url: string | null;
  is_sampel_disimpan: boolean;
  catatan_kelayakan: string | null;
  kesimpulan: OrganolepticKesimpulan;
  catatan_kejadian_khusus: string | null;
  dibuat_pada: string;
}

export type AttendanceStatus = 'MENUNGGU' | 'SUDAH_TERIMA_MBG' | 'OMPRENG_KEMBALI';

export interface DailyAttendance {
  id: string;
  id_kelas: string;
  id_uji: string;
  tanggal: string;
  jumlah_hadir: number;
  jumlah_absen: number;
  status_ambil: AttendanceStatus;
  ompreng_utuh: number;
  ompreng_rusak: number;
  ompreng_hilang: number;
  ttd_perwakilan_siswa: string | null;
  waktu_terima_kelas: string | null;
  waktu_kembali_ompreng: string | null;
  dibuat_pada: string;
  kelas?: Kelas;
}

export interface StudentMbgLog {
  id: string;
  id_log: string;
  nisn: string;
  nama_siswa_snapshot: string | null;
  tipe_klaim: 'KOLEKTIF_KELAS' | 'MANDIRI' | 'SUSULAN';
  status_terima: 'SUDAH_AMBIL' | 'ABSEN_TIDAK_AMBIL';
  waktu_ambil: string;
}

export interface LiveActivityFeedItem {
  id: string;
  nama_kelas: string;
  deskripsi: string;
  waktu: string;
  tipe: 'KOLEKTIF_KELAS' | 'MANDIRI' | 'SUSULAN';
  jumlah_porsi: number;
}

export interface ClassMonitoringStatus {
  id_kelas: string;
  nama_kelas: string;
  jurusan: string;
  tingkat: string;
  total_siswa: number;
  jumlah_hadir: number;
  jumlah_absen: number;
  status_ambil: AttendanceStatus;
  persen: number;
  waktu_terima: string | null;
}

export interface StudentRecord {
  nisn: string;
  nama_lengkap: string;
  id_kelas: string;
  nama_kelas: string;
  jurusan: string;
  alergi_makanan: string | null;
  is_perwakilan_kelas: boolean;
  sudah_ambil: boolean;
  waktu_ambil: string | null;
}

export interface CrmCampaign {
  id: string;
  judul_promo: string;
  banner_image_url: string | null;
  target_tingkat: string;
  target_jurusan: string[];
  rekomendasi_fakultas_ubsi: string | null;
  cta_url_template: string | null;
  poin_interaksi: number;
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
