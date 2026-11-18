import * as XLSX from 'xlsx';
import { normalizePhone628, isValidPhone628 } from './services';

// ============================================================
// PARSER EXPORT DAPODIK (Sheet "Daftar Siswa")
// Data pribadi (NIK, alamat, orang tua) hanya dibawa ke database,
// tidak pernah ditampilkan di antarmuka web.
// ============================================================

export interface DapodikStudentRow {
  rowNumber: number;
  kelas: string;
  tingkat: string;
  jurusan: string;
  nisn: string;
  nama: string;
  noHp: string | null;
  nipd: string | null;
  nik: string | null;
  jenisKelamin: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  agama: string | null;
  alamat: string | null;
  rt: string | null;
  rw: string | null;
  desaKelurahan: string | null;
  kodePos: string | null;
  namaAyah: string | null;
  namaIbu: string | null;
}

export interface DapodikClassSummary {
  kelas: string;
  jumlah: number;
  tanpaHp: number;
}

export interface DapodikParseResult {
  npsn: string;
  schoolNameRaw: string;
  rows: DapodikStudentRow[];
  perClass: DapodikClassSummary[];
  totalTanpaHp: number;
  issues: string[];
}

function cleanText(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function optionalText(value: unknown): string | null {
  const text = cleanText(value);
  return text && text !== '-' ? text : null;
}

function normalizeHeader(value: unknown): string {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function parseDapodikDate(raw: unknown): string | null {
  const text = cleanText(raw);
  if (!text) return null;
  let day: string;
  let month: string;
  let year: string;

  const dmy = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  const ymd = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (dmy) {
    [, day, month, year] = dmy;
  } else if (ymd) {
    [, year, month, day] = ymd;
  } else {
    return null;
  }

  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function deriveClassMeta(kelas: string): { tingkat: string; jurusan: string } {
  const tokens = cleanText(kelas).toUpperCase().split(' ').filter(Boolean);
  const tingkat = tokens[0] || 'XII';
  const rest = tokens.slice(1);
  if (rest.length > 1 && /^([A-Z]|\d+)$/.test(rest[rest.length - 1])) {
    rest.pop();
  }
  return { tingkat, jurusan: rest.join(' ') || 'UMUM' };
}

export function normalizeSchoolName(raw: string): string {
  const base = cleanText(raw)
    .replace(/^SMK\s+NEGERI/i, 'SMKN')
    .replace(/^SMA\s+NEGERI/i, 'SMAN')
    .replace(/^SMP\s+NEGERI/i, 'SMPN');
  return base
    .split(' ')
    .map((token) => {
      if (/^(SMKN|SMAN|SMPN|SMK|SMA|SMP|MAN|MA)$/i.test(token)) return token.toUpperCase();
      if (/^\d+$/.test(token)) return token;
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(' ');
}

function findHeaderRow(matrix: unknown[][]): number {
  const limit = Math.min(matrix.length, 20);
  for (let i = 0; i < limit; i++) {
    const cells = matrix[i].map(normalizeHeader);
    const hasNisn = cells.includes('nisn');
    const hasName = cells.includes('nama siswa') || cells.includes('nama lengkap');
    if (hasNisn && hasName) return i;
  }
  return -1;
}

function detectSchool(wb: XLSX.WorkBook, listMatrix: unknown[][]): { npsn: string; name: string } {
  let npsn = '';
  let name = '';

  const notes = wb.Sheets['Catatan'];
  if (notes) {
    const noteRows = XLSX.utils.sheet_to_json<unknown[]>(notes, {
      header: 1,
      defval: '',
      raw: false,
    });
    for (const row of noteRows) {
      const key = normalizeHeader(row[0]);
      if (key === 'npsn') npsn = cleanText(row[1]);
      if (key === 'nama sekolah') name = cleanText(row[1]);
    }
  }

  if (!npsn || !name) {
    for (const row of listMatrix.slice(0, 5)) {
      const text = cleanText(row[0]);
      const npsnMatch = text.match(/NPSN\s*[:\-]?\s*(\d{6,10})/i);
      if (npsnMatch && !npsn) npsn = npsnMatch[1];
      if (text.includes('•') && !name) name = cleanText(text.split('•')[0]);
    }
  }

  return { npsn, name };
}

/**
 * Mengembalikan null bila workbook bukan format export Dapodik
 * (tidak ada sheet dengan kolom Kelas, NISN, dan Nama Siswa).
 */
export function parseDapodikWorkbook(wb: XLSX.WorkBook): DapodikParseResult | null {
  const preferred = wb.SheetNames.includes('Daftar Siswa')
    ? ['Daftar Siswa', ...wb.SheetNames.filter((n) => n !== 'Daftar Siswa')]
    : wb.SheetNames;

  for (const sheetName of preferred) {
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
      header: 1,
      defval: '',
      raw: false,
    });
    const headerIdx = findHeaderRow(matrix);
    if (headerIdx < 0) continue;

    const headers = matrix[headerIdx].map(normalizeHeader);
    const col = (...names: string[]) => headers.findIndex((h) => names.includes(h));

    const cKelas = col('kelas', 'rombel', 'nama kelas');
    const cNama = col('nama siswa', 'nama lengkap');
    const cNisn = col('nisn');
    if (cKelas < 0 || cNama < 0 || cNisn < 0) continue;

    const cNipd = col('nipd');
    const cNik = col('nik');
    const cJk = col('jenis kelamin');
    const cTempat = col('tempat lahir');
    const cTgl = col('tanggal lahir');
    const cAgama = col('agama');
    const cAlamat = col('alamat');
    const cRt = col('rt');
    const cRw = col('rw');
    const cDesa = col('desa kelurahan');
    const cPos = col('kode pos');
    const cHp = col('no hp', 'no handphone', 'hp', 'no telepon');
    const cAyah = col('nama ayah');
    const cIbu = col('nama ibu');

    const get = (row: unknown[], idx: number) => (idx >= 0 ? row[idx] : '');

    const issues: string[] = [];
    const rows: DapodikStudentRow[] = [];
    const seenNisn = new Set<string>();
    let invalidPhoneCount = 0;

    for (let i = headerIdx + 1; i < matrix.length; i++) {
      const raw = matrix[i];
      const rowNumber = i + 1;
      const kelas = cleanText(get(raw, cKelas));
      const nama = cleanText(get(raw, cNama));
      const nisnDigits = cleanText(get(raw, cNisn)).replace(/\D/g, '');

      if (!kelas && !nama && !nisnDigits) continue;
      if (kelas.toUpperCase() === 'TOTAL' || kelas.toUpperCase() === 'JUMLAH') continue;

      if (!kelas || !nama) {
        issues.push(`Baris ${rowNumber}: kelas atau nama kosong, dilewati.`);
        continue;
      }

      let nisn = nisnDigits;
      if (nisn.length >= 8 && nisn.length < 10) {
        nisn = nisn.padStart(10, '0');
      }
      if (nisn.length !== 10) {
        issues.push(`Baris ${rowNumber} (${nama}): NISN "${nisnDigits}" tidak valid, dilewati.`);
        continue;
      }
      if (seenNisn.has(nisn)) {
        issues.push(`Baris ${rowNumber} (${nama}): NISN ${nisn} ganda, dilewati.`);
        continue;
      }
      seenNisn.add(nisn);

      const rawPhone = cleanText(get(raw, cHp));
      let noHp: string | null = null;
      if (rawPhone) {
        const normalized = normalizePhone628(rawPhone);
        if (isValidPhone628(normalized)) {
          noHp = normalized;
        } else {
          invalidPhoneCount++;
        }
      }

      const meta = deriveClassMeta(kelas);
      rows.push({
        rowNumber,
        kelas,
        tingkat: meta.tingkat,
        jurusan: meta.jurusan,
        nisn,
        nama,
        noHp,
        nipd: optionalText(get(raw, cNipd)),
        nik: optionalText(get(raw, cNik)),
        jenisKelamin: optionalText(get(raw, cJk)),
        tempatLahir: optionalText(get(raw, cTempat)),
        tanggalLahir: parseDapodikDate(get(raw, cTgl)),
        agama: optionalText(get(raw, cAgama)),
        alamat: optionalText(get(raw, cAlamat)),
        rt: optionalText(get(raw, cRt)),
        rw: optionalText(get(raw, cRw)),
        desaKelurahan: optionalText(get(raw, cDesa)),
        kodePos: optionalText(get(raw, cPos)),
        namaAyah: optionalText(get(raw, cAyah)),
        namaIbu: optionalText(get(raw, cIbu)),
      });
    }

    if (rows.length === 0) continue;

    if (invalidPhoneCount > 0) {
      issues.push(
        `${invalidPhoneCount} nomor HP tidak valid diabaikan (siswa tetap diimpor tanpa nomor HP).`
      );
    }

    const classMap = new Map<string, DapodikClassSummary>();
    for (const r of rows) {
      const entry = classMap.get(r.kelas) || { kelas: r.kelas, jumlah: 0, tanpaHp: 0 };
      entry.jumlah += 1;
      if (!r.noHp) entry.tanpaHp += 1;
      classMap.set(r.kelas, entry);
    }

    const school = detectSchool(wb, matrix);
    return {
      npsn: school.npsn,
      schoolNameRaw: school.name,
      rows,
      perClass: Array.from(classMap.values()),
      totalTanpaHp: rows.filter((r) => !r.noHp).length,
      issues,
    };
  }

  return null;
}
