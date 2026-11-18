// Generator script SQL sekali jalan untuk import data siswa export Dapodik ke Supabase.
//
// Pemakaian:
//   node scripts/generate-smkn5-seed.mjs [file.xlsx] [output.sql]
//
// Default:
//   input  : Data_Siswa_Kelas_XII_Semester_Gasal_2026-2027.xlsx
//   output : supabase/seeds/smkn5_siswa_xii.sql   (folder ini di-gitignore: berisi data pribadi siswa)
//
// Hasil SQL dijalankan SEKALI di Supabase Dashboard -> SQL Editor.
// SQL sudah memuat migrasi (idempotent), sekolah, kelas, siswa, dan data pribadi.

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const NPSN = '20328109';
const SCHOOL_NAME = 'SMKN 5 Surakarta';
const SCHOOL_ID = '88888888-8888-4888-8888-888888888881';

const inputPath = resolve(process.argv[2] || 'Data_Siswa_Kelas_XII_Semester_Gasal_2026-2027.xlsx');
const outputPath = resolve(process.argv[3] || 'supabase/seeds/smkn5_siswa_xii.sql');
const migrationPath = resolve('supabase/migrations/20261117_smkn5_import_support.sql');

const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const norm = (v) => clean(v).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const opt = (v) => {
  const t = clean(v);
  return t && t !== '-' ? t : null;
};

function normalizePhone(raw) {
  const digits = clean(raw).replace(/\D/g, '');
  if (!digits) return null;
  let p = digits;
  if (p.startsWith('6208')) p = '628' + p.slice(4);
  else if (p.startsWith('08')) p = '628' + p.slice(2);
  else if (p.startsWith('8')) p = '628' + p.slice(1);
  return /^628\d{7,13}$/.test(p) ? p : null;
}

function parseDate(raw) {
  const t = clean(raw);
  const m = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function classMeta(kelas) {
  const tokens = clean(kelas).toUpperCase().split(' ').filter(Boolean);
  const tingkat = tokens[0] || 'XII';
  const rest = tokens.slice(1);
  if (rest.length > 1 && /^([A-Z]|\d+)$/.test(rest[rest.length - 1])) rest.pop();
  return { tingkat, jurusan: rest.join(' ') || 'UMUM' };
}

// Literal SQL aman: escape kutip tunggal, buang karakter kontrol.
const q = (v) =>
  v === null || v === undefined || v === ''
    ? 'NULL'
    : `'${String(v).replace(/[\u0000-\u001f]/g, ' ').replace(/'/g, "''")}'`;

const wb = XLSX.readFile(inputPath);
const sheetName = wb.SheetNames.includes('Daftar Siswa') ? 'Daftar Siswa' : wb.SheetNames[0];
const matrix = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '', raw: false });

const headerIdx = matrix.slice(0, 20).findIndex((row) => {
  const cells = row.map(norm);
  return cells.includes('nisn') && (cells.includes('nama siswa') || cells.includes('nama lengkap'));
});
if (headerIdx < 0) throw new Error(`Header tabel (NISN, Nama Siswa) tidak ditemukan di sheet "${sheetName}".`);

const headers = matrix[headerIdx].map(norm);
const col = (...names) => headers.findIndex((h) => names.includes(h));
const C = {
  kelas: col('kelas', 'rombel', 'nama kelas'),
  nama: col('nama siswa', 'nama lengkap'),
  nisn: col('nisn'),
  nipd: col('nipd'),
  nik: col('nik'),
  jk: col('jenis kelamin'),
  tempat: col('tempat lahir'),
  tgl: col('tanggal lahir'),
  agama: col('agama'),
  alamat: col('alamat'),
  rt: col('rt'),
  rw: col('rw'),
  desa: col('desa kelurahan'),
  pos: col('kode pos'),
  hp: col('no hp', 'no handphone', 'hp'),
  ayah: col('nama ayah'),
  ibu: col('nama ibu'),
};
if (C.kelas < 0 || C.nama < 0 || C.nisn < 0) throw new Error('Kolom Kelas / Nama Siswa / NISN wajib ada.');
const cell = (row, idx) => (idx >= 0 ? row[idx] : '');

const rows = [];
const seen = new Set();
const skipped = [];
for (let i = headerIdx + 1; i < matrix.length; i++) {
  const r = matrix[i];
  const kelas = clean(cell(r, C.kelas));
  const nama = clean(cell(r, C.nama));
  let nisn = clean(cell(r, C.nisn)).replace(/\D/g, '');
  if (!kelas && !nama && !nisn) continue;
  if (['TOTAL', 'JUMLAH'].includes(kelas.toUpperCase())) continue;
  if (nisn.length >= 8 && nisn.length < 10) nisn = nisn.padStart(10, '0');
  if (!kelas || !nama || nisn.length !== 10) {
    skipped.push(`Baris ${i + 1}: data tidak lengkap/NISN tidak valid (${nama || '-'})`);
    continue;
  }
  if (seen.has(nisn)) {
    skipped.push(`Baris ${i + 1}: NISN ganda ${nisn} (${nama})`);
    continue;
  }
  seen.add(nisn);
  const meta = classMeta(kelas);
  rows.push({
    kelas,
    tingkat: meta.tingkat,
    jurusan: meta.jurusan,
    nipd: opt(cell(r, C.nipd)),
    nisn,
    nama,
    hp: normalizePhone(cell(r, C.hp)),
    nik: opt(cell(r, C.nik)),
    jk: opt(cell(r, C.jk)),
    tempat: opt(cell(r, C.tempat)),
    tgl: parseDate(cell(r, C.tgl)),
    agama: opt(cell(r, C.agama)),
    alamat: opt(cell(r, C.alamat)),
    rt: opt(cell(r, C.rt)),
    rw: opt(cell(r, C.rw)),
    desa: opt(cell(r, C.desa)),
    pos: opt(cell(r, C.pos)),
    ayah: opt(cell(r, C.ayah)),
    ibu: opt(cell(r, C.ibu)),
  });
}

// Migrasi di-inline tanpa begin/commit karena seluruh script berjalan dalam satu transaksi.
const migrationSql = readFileSync(migrationPath, 'utf8')
  .replace(/^\s*begin;\s*$/im, '')
  .replace(/^\s*commit;\s*$/im, '');

const valuesLine = (r) =>
  `(${[
    q(r.kelas), q(r.tingkat), q(r.jurusan), q(r.nipd), q(r.nisn), q(r.nama), q(r.hp), q(r.nik),
    q(r.jk), q(r.tempat), r.tgl ? `${q(r.tgl)}::date` : 'NULL::date', q(r.agama), q(r.alamat),
    q(r.rt), q(r.rw), q(r.desa), q(r.pos), q(r.ayah), q(r.ibu),
  ].join(', ')})`;

const CHUNK = 100;
const insertBlocks = [];
for (let i = 0; i < rows.length; i += CHUNK) {
  const slice = rows.slice(i, i + CHUNK).map(valuesLine).join(',\n  ');
  insertBlocks.push(`insert into _stg_siswa values\n  ${slice};`);
}

const sql = `-- ============================================================
-- SEED SEKALI JALAN: ${SCHOOL_NAME} (NPSN ${NPSN})
-- Dihasilkan otomatis dari ${inputPath.split('/').pop()}
-- ${rows.length} siswa, ${new Set(rows.map((r) => r.kelas)).size} kelas
--
-- BERISI DATA PRIBADI SISWA (NIK, alamat, orang tua).
-- JANGAN di-commit ke Git dan JANGAN dibagikan. Folder ini sudah di-gitignore.
-- Aman dijalankan ulang (idempotent): siswa diperbarui berdasarkan NISN,
-- No. HP yang sudah diisi manual TIDAK ditimpa dengan kosong.
-- ============================================================

begin;

-- ---------- 1. Migrasi (jurusan bebas, no_hp opsional, tabel student_private, sekolah) ----------
${migrationSql.trim()}

-- ---------- 2. Staging data Dapodik ----------
create temp table _stg_siswa (
  kelas text, tingkat text, jurusan text, nipd text, nisn text, nama text, no_hp text, nik text,
  jenis_kelamin text, tempat_lahir text, tanggal_lahir date, agama text, alamat text,
  rt text, rw text, desa_kelurahan text, kode_pos text, nama_ayah text, nama_ibu text
) on commit drop;

${insertBlocks.join('\n\n')}

-- ---------- 3. Kelas (pakai kelas yang sudah ada bila namanya sama) ----------
insert into public.classes (id, id_sekolah, nama_kelas, tingkat, jurusan, total_siswa_dapodik, status_aktif)
select
  coalesce(
    (select c.id from public.classes c
      where c.id_sekolah = sch.id and lower(c.nama_kelas) = lower(s.kelas) limit 1),
    md5('smkn5:${NPSN}:' || lower(s.kelas))::uuid
  ),
  sch.id, s.kelas, max(s.tingkat), max(s.jurusan), count(*), true
from _stg_siswa s
cross join (select id from public.schools where npsn = '${NPSN}') sch
group by sch.id, s.kelas
on conflict (id) do update
  set total_siswa_dapodik = excluded.total_siswa_dapodik,
      jurusan = excluded.jurusan,
      diperbarui_pada = now();

-- ---------- 4. Siswa (No. HP kosong dibiarkan kosong; nomor manual tidak ditimpa) ----------
insert into public.students (nisn, id_kelas, nama_lengkap, no_hp, jurusan, status_aktif)
select s.nisn, c.id, s.nama, s.no_hp, s.jurusan, true
from _stg_siswa s
join public.schools sch on sch.npsn = '${NPSN}'
join public.classes c on c.id_sekolah = sch.id and lower(c.nama_kelas) = lower(s.kelas)
on conflict (nisn) do update
  set id_kelas = excluded.id_kelas,
      nama_lengkap = excluded.nama_lengkap,
      jurusan = excluded.jurusan,
      no_hp = coalesce(excluded.no_hp, public.students.no_hp),
      diperbarui_pada = now();

-- ---------- 5. Data pribadi (tabel terpisah, tidak bisa dibaca publik) ----------
insert into public.student_private (
  nisn, nipd, nik, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, alamat,
  rt, rw, desa_kelurahan, kode_pos, nama_ayah, nama_ibu
)
select
  nisn, nipd, nik, jenis_kelamin, tempat_lahir, tanggal_lahir, agama, alamat,
  rt, rw, desa_kelurahan, kode_pos, nama_ayah, nama_ibu
from _stg_siswa
on conflict (nisn) do update
  set nipd = excluded.nipd, nik = excluded.nik, jenis_kelamin = excluded.jenis_kelamin,
      tempat_lahir = excluded.tempat_lahir, tanggal_lahir = excluded.tanggal_lahir,
      agama = excluded.agama, alamat = excluded.alamat, rt = excluded.rt, rw = excluded.rw,
      desa_kelurahan = excluded.desa_kelurahan, kode_pos = excluded.kode_pos,
      nama_ayah = excluded.nama_ayah, nama_ibu = excluded.nama_ibu,
      diperbarui_pada = now();

-- ---------- 6. Verifikasi (hasil tampil di SQL Editor) ----------
select c.nama_kelas, c.total_siswa_dapodik as target, count(s.nisn) as terimpor,
       count(*) filter (where s.no_hp is null) as tanpa_hp
from public.classes c
join public.schools sch on sch.id = c.id_sekolah and sch.npsn = '${NPSN}'
left join public.students s on s.id_kelas = c.id
group by c.nama_kelas, c.total_siswa_dapodik
order by c.nama_kelas;

commit;
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, sql, 'utf8');

console.log(`OK  : ${rows.length} siswa, ${new Set(rows.map((r) => r.kelas)).size} kelas`);
console.log(`Tanpa No. HP: ${rows.filter((r) => !r.hp).length}`);
console.log(`Ditulis ke: ${outputPath}`);
if (skipped.length) {
  console.log(`Dilewati (${skipped.length}):`);
  skipped.forEach((s) => console.log(`  - ${s}`));
}
