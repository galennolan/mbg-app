import { supabase } from './supabase/client';
import { DistribusiMBG, Kelas, PenerimaanMBG, Siswa, RiwayatAktivitas, StatusPenerimaan } from './types';
import { getJakartaDateString } from './utils';

// Helper to log audit activity
export async function logActivity(
  aktivitas: string,
  tabelTerkait: string,
  dataId: string | null = null,
  dataSebelum: any = null,
  dataSesudah: any = null,
  penggunaId: string | null = null
) {
  try {
    await supabase.from('riwayat_aktivitas').insert({
      aktivitas,
      tabel_terkait: tabelTerkait,
      data_id: dataId,
      data_sebelum: dataSebelum,
      data_sesudah: dataSesudah,
      pengguna_id: penggunaId,
      waktu_aktivitas: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// 1. Get or create today's distribution record
export async function getTodayDistribution(): Promise<DistribusiMBG | null> {
  const today = getJakartaDateString();
  try {
    // Try via RPC first if exists
    const { data: rpcData, error: rpcErr } = await supabase.rpc('status_distribusi_hari_ini', {
      p_tanggal: today,
    });
    if (!rpcErr && rpcData && rpcData.length > 0) {
      return rpcData[0] as DistribusiMBG;
    }

    // Direct table query
    const { data, error } = await supabase
      .from('distribusi_mbg')
      .select('*, petugas:petugas_id(id, nama, email)')
      .eq('tanggal', today)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('getTodayDistribution error:', error);
    }
    return data as DistribusiMBG | null;
  } catch (err) {
    console.error('getTodayDistribution error:', err);
    return null;
  }
}

// Create today's distribution if not existing
export async function ensureTodayDistribution(petugasId?: string): Promise<DistribusiMBG> {
  const today = getJakartaDateString();
  const existing = await getTodayDistribution();
  if (existing) return existing;

  const newDist: Partial<DistribusiMBG> = {
    tanggal: today,
    status: 'menunggu',
    petugas_id: petugasId || null,
  };

  const { data, error } = await supabase
    .from('distribusi_mbg')
    .insert(newDist)
    .select('*, petugas:petugas_id(id, nama, email)')
    .single();

  if (error) {
    throw new Error('Gagal membuat kegiatan distribusi hari ini: ' + error.message);
  }

  await logActivity(
    'buat_distribusi_harian',
    'distribusi_mbg',
    data.id,
    null,
    data,
    petugasId
  );

  return data as DistribusiMBG;
}

// 2. Mark MBG Arrival (Kedatangan MBG)
export async function markMBGArrival(params: {
  distribusiId: string;
  waktuKedatangan: string;
  keterangan?: string;
  petugasId: string;
}): Promise<DistribusiMBG> {
  const waktuInput = new Date().toISOString();

  const { data: current } = await supabase
    .from('distribusi_mbg')
    .select('*')
    .eq('id', params.distribusiId)
    .single();

  const { data, error } = await supabase
    .from('distribusi_mbg')
    .update({
      status: 'tiba',
      waktu_kedatangan: params.waktuKedatangan,
      waktu_input: waktuInput,
      keterangan: params.keterangan || null,
      petugas_id: params.petugasId,
      diperbarui_pada: waktuInput,
    })
    .eq('id', params.distribusiId)
    .select('*, petugas:petugas_id(id, nama, email)')
    .single();

  if (error) {
    throw new Error('Gagal mencatat kedatangan MBG: ' + error.message);
  }

  await logActivity(
    'catat_kedatangan_mbg',
    'distribusi_mbg',
    params.distribusiId,
    current,
    data,
    params.petugasId
  );

  return data as DistribusiMBG;
}

// 3. Close Distribution
export async function closeTodayDistribution(
  distribusiId: string,
  petugasId: string
): Promise<DistribusiMBG> {
  const waktuInput = new Date().toISOString();

  const { data: current } = await supabase
    .from('distribusi_mbg')
    .select('*')
    .eq('id', distribusiId)
    .single();

  const { data, error } = await supabase
    .from('distribusi_mbg')
    .update({
      status: 'ditutup',
      diperbarui_pada: waktuInput,
    })
    .eq('id', distribusiId)
    .select('*, petugas:petugas_id(id, nama, email)')
    .single();

  if (error) {
    throw new Error('Gagal menutup distribusi: ' + error.message);
  }

  await logActivity(
    'tutup_distribusi',
    'distribusi_mbg',
    distribusiId,
    current,
    data,
    petugasId
  );

  return data as DistribusiMBG;
}

// 4. Public Student Search (FR-02, FR-03, FR-04, FR-05)
export interface CandidateStudent {
  id: string;
  nama: string;
  nama_kelas: string;
  jurusan: string;
  sudah_menerima: boolean;
  waktu_penerimaan?: string | null;
}

export async function searchStudentsForConfirmation(
  searchQuery: string,
  kelasId?: string,
  jurusan?: string
): Promise<CandidateStudent[]> {
  try {
    // 1. Try RPC cari_siswa
    const { data: rpcData, error: rpcErr } = await supabase.rpc('cari_siswa', {
      p_nama: searchQuery || '',
      p_kelas_id: kelasId || null,
      p_jurusan: jurusan || null,
    });

    if (!rpcErr && rpcData) {
      return rpcData as CandidateStudent[];
    }
  } catch (e) {
    // Fall back to direct query
  }

  // 2. Direct Query Fallback
  const today = getJakartaDateString();
  const { data: dist } = await supabase
    .from('distribusi_mbg')
    .select('id')
    .eq('tanggal', today)
    .maybeSingle();

  const distribusiId = dist?.id;

  let query = supabase
    .from('siswa')
    .select('id, nama, kelas:kelas_id(id, nama_kelas, jurusan)')
    .eq('status_aktif', true)
    .ilike('nama', `%${searchQuery.trim()}%`)
    .limit(30);

  if (kelasId) {
    query = query.eq('kelas_id', kelasId);
  }

  const { data: students, error } = await query;
  if (error || !students) return [];

  // Filter jurusan in memory if kelas relation returned
  let filtered = students.map((s: any) => ({
    id: s.id,
    nama: s.nama,
    nama_kelas: s.kelas?.nama_kelas || '-',
    jurusan: s.kelas?.jurusan || '-',
  }));

  if (jurusan) {
    filtered = filtered.filter((f) => f.jurusan === jurusan);
  }

  // Check which students already received today
  if (distribusiId && filtered.length > 0) {
    const studentIds = filtered.map((s) => s.id);
    const { data: receipts } = await supabase
      .from('penerimaan_mbg')
      .select('siswa_id, status_penerimaan, waktu_penerimaan')
      .eq('distribusi_id', distribusiId)
      .in('siswa_id', studentIds);

    const receiptMap = new Map(
      (receipts || []).map((r: any) => [r.siswa_id, r])
    );

    return filtered.map((s) => {
      const rec = receiptMap.get(s.id);
      return {
        ...s,
        sudah_menerima: rec ? rec.status_penerimaan === 'diterima' : false,
        waktu_penerimaan: rec?.waktu_penerimaan || null,
      };
    });
  }

  return filtered.map((s) => ({
    ...s,
    sudah_menerima: false,
    waktu_penerimaan: null,
  }));
}

// 5. Student Self Confirmation (FR-08, BR-01, BR-02, BR-03)
export async function confirmStudentSelf(studentId: string): Promise<{
  success: boolean;
  message: string;
  already_received?: boolean;
  nama_siswa?: string;
  kelas?: string;
  waktu_penerimaan?: string;
}> {
  // Try RPC first
  try {
    const { data, error } = await supabase.rpc('konfirmasi_penerimaan_siswa', {
      p_siswa_id: studentId,
    });
    if (!error && data) {
      return data;
    }
  } catch (e) {
    // Continue to direct process
  }

  const today = getJakartaDateString();
  const { data: dist, error: distErr } = await supabase
    .from('distribusi_mbg')
    .select('*')
    .eq('tanggal', today)
    .maybeSingle();

  if (distErr || !dist) {
    return {
      success: false,
      message: 'Distribusi hari ini belum dibuka oleh pihak sekolah.',
    };
  }

  if (dist.status === 'menunggu') {
    return {
      success: false,
      message: 'MBG Belum Tiba. Konfirmasi penerimaan belum dibuka.',
    };
  }

  if (dist.status === 'ditutup') {
    return {
      success: false,
      message: 'Distribusi MBG hari ini sudah ditutup.',
    };
  }

  // Check student
  const { data: siswa, error: siswaErr } = await supabase
    .from('siswa')
    .select('*, kelas:kelas_id(id, nama_kelas, jurusan)')
    .eq('id', studentId)
    .single();

  if (siswaErr || !siswa) {
    return { success: false, message: 'Data siswa tidak ditemukan.' };
  }

  // Check if existing
  const { data: existing } = await supabase
    .from('penerimaan_mbg')
    .select('*')
    .eq('distribusi_id', dist.id)
    .eq('siswa_id', studentId)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      already_received: true,
      message: 'Anda sudah tercatat menerima MBG.',
      waktu_penerimaan: existing.waktu_penerimaan,
    };
  }

  const serverTime = new Date().toISOString();
  const { data: newReceipt, error: insErr } = await supabase
    .from('penerimaan_mbg')
    .insert({
      distribusi_id: dist.id,
      siswa_id: siswa.id,
      nama_siswa: siswa.nama,
      nisn: siswa.nisn,
      kelas: siswa.kelas?.nama_kelas || 'Kelas',
      jurusan: siswa.kelas?.jurusan || 'Jurusan',
      status_penerimaan: 'diterima',
      waktu_penerimaan: serverTime,
      sumber_pencatatan: 'siswa',
      petugas_id: null,
    })
    .select()
    .single();

  if (insErr) {
    if (insErr.code === '23505') {
      return {
        success: false,
        already_received: true,
        message: 'Anda sudah tercatat menerima MBG sebelumnya.',
      };
    }
    return { success: false, message: 'Gagal mencatat penerimaan: ' + insErr.message };
  }

  await logActivity(
    'konfirmasi_mandiri_siswa',
    'penerimaan_mbg',
    newReceipt.id,
    null,
    { siswa_id: siswa.id, nama: siswa.nama, waktu: serverTime }
  );

  return {
    success: true,
    message: 'Penerimaan MBG berhasil dikonfirmasi.',
    nama_siswa: siswa.nama,
    kelas: siswa.kelas?.nama_kelas,
    waktu_penerimaan: serverTime,
  };
}

// 6. Teacher Individual Confirmation (FR-11)
export async function confirmTeacherIndividual(params: {
  distribusiId: string;
  siswaId: string;
  status: StatusPenerimaan;
  petugasId: string;
}): Promise<PenerimaanMBG> {
  const { data: siswa, error: siswaErr } = await supabase
    .from('siswa')
    .select('*, kelas:kelas_id(id, nama_kelas, jurusan)')
    .eq('id', params.siswaId)
    .single();

  if (siswaErr || !siswa) {
    throw new Error('Siswa tidak ditemukan');
  }

  const serverTime = params.status === 'diterima' ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from('penerimaan_mbg')
    .upsert(
      {
        distribusi_id: params.distribusiId,
        siswa_id: params.siswaId,
        nama_siswa: siswa.nama,
        nisn: siswa.nisn,
        kelas: siswa.kelas?.nama_kelas || 'Kelas',
        jurusan: siswa.kelas?.jurusan || 'Jurusan',
        status_penerimaan: params.status,
        waktu_penerimaan: serverTime,
        sumber_pencatatan: 'guru',
        petugas_id: params.petugasId,
        diperbarui_pada: new Date().toISOString(),
      },
      { onConflict: 'distribusi_id,siswa_id' }
    )
    .select('*, petugas:petugas_id(id, nama, email)')
    .single();

  if (error) {
    throw new Error('Gagal mencatat: ' + error.message);
  }

  await logActivity(
    'konfirmasi_individu_guru',
    'penerimaan_mbg',
    data.id,
    null,
    data,
    params.petugasId
  );

  return data as PenerimaanMBG;
}

// 7. Teacher Class Mass Confirmation (FR-12, FR-13, FR-14)
export async function confirmTeacherClassMass(params: {
  distribusiId: string;
  siswaIds: string[];
  petugasId: string;
}): Promise<{ berhasil: number; dilewati: number }> {
  // Try RPC if available
  try {
    const { data, error } = await supabase.rpc('konfirmasi_massal_kelas', {
      p_distribusi_id: params.distribusiId,
      p_siswa_ids: params.siswaIds,
    });
    if (!error && data) {
      await logActivity(
        'konfirmasi_massal_kelas',
        'penerimaan_mbg',
        params.distribusiId,
        null,
        data,
        params.petugasId
      );
      return data;
    }
  } catch (e) {
    // Continue direct fallback
  }

  // Fetch all students
  const { data: siswaList } = await supabase
    .from('siswa')
    .select('id, nama, nisn, kelas:kelas_id(id, nama_kelas, jurusan)')
    .in('id', params.siswaIds)
    .eq('status_aktif', true);

  if (!siswaList || siswaList.length === 0) {
    return { berhasil: 0, dilewati: 0 };
  }

  // Existing receipts for this distribution
  const { data: existing } = await supabase
    .from('penerimaan_mbg')
    .select('siswa_id')
    .eq('distribusi_id', params.distribusiId)
    .in('siswa_id', params.siswaIds);

  const existingSet = new Set((existing || []).map((e: any) => e.siswa_id));
  const serverTime = new Date().toISOString();

  const toInsert: any[] = [];
  let skipped = 0;

  for (const s of siswaList) {
    if (existingSet.has(s.id)) {
      skipped++;
    } else {
      toInsert.push({
        distribusi_id: params.distribusiId,
        siswa_id: s.id,
        nama_siswa: s.nama,
        nisn: s.nisn,
        kelas: (s.kelas as any)?.nama_kelas || 'Kelas',
        jurusan: (s.kelas as any)?.jurusan || 'Jurusan',
        status_penerimaan: 'diterima',
        waktu_penerimaan: serverTime,
        sumber_pencatatan: 'guru',
        petugas_id: params.petugasId,
      });
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('penerimaan_mbg').insert(toInsert);
    if (error) {
      throw new Error('Gagal mencatat konfirmasi massal: ' + error.message);
    }
  }

  await logActivity(
    'konfirmasi_massal_kelas',
    'penerimaan_mbg',
    params.distribusiId,
    null,
    { berhasil: toInsert.length, dilewati: skipped },
    params.petugasId
  );

  return { berhasil: toInsert.length, dilewati: skipped };
}

// 8. Dashboard Statistics (FR-15, Section 5)
export async function getDashboardStatistics(distribusiId?: string) {
  // Get active students
  const { count: totalSiswaAktif } = await supabase
    .from('siswa')
    .select('*', { count: 'exact', head: true })
    .eq('status_aktif', true);

  if (!distribusiId) {
    return {
      totalSiswa: totalSiswaAktif || 0,
      totalDiterima: 0,
      totalBelum: totalSiswaAktif || 0,
      persen: 0,
      totalTidakHadir: 0,
      totalTidakMengambil: 0,
      waktuPertama: null,
      waktuTerakhir: null,
      rekapKelas: [],
      rekapJurusan: [],
      recentActivities: [],
    };
  }

  // Fetch receipts for today
  const { data: receipts } = await supabase
    .from('penerimaan_mbg')
    .select('*, petugas:petugas_id(id, nama)')
    .eq('distribusi_id', distribusiId)
    .order('waktu_penerimaan', { ascending: true });

  const validReceipts = (receipts || []).filter(
    (r) => r.status_penerimaan === 'diterima'
  );
  const tidakHadirCount = (receipts || []).filter(
    (r) => r.status_penerimaan === 'tidak_hadir'
  ).length;
  const tidakMengambilCount = (receipts || []).filter(
    (r) => r.status_penerimaan === 'tidak_mengambil'
  ).length;

  const totalDiterima = validReceipts.length;
  const totalSiswa = totalSiswaAktif || 0;
  const totalBelum = Math.max(0, totalSiswa - totalDiterima);
  const persen = totalSiswa > 0 ? ((totalDiterima / totalSiswa) * 100).toFixed(1) : '0';

  const waktuPertama = validReceipts.length > 0 ? validReceipts[0].waktu_penerimaan : null;
  const waktuTerakhir =
    validReceipts.length > 0
      ? validReceipts[validReceipts.length - 1].waktu_penerimaan
      : null;

  // Rekap Kelas & Jurusan
  const { data: allKelas } = await supabase
    .from('kelas')
    .select('*, siswa:siswa(id)')
    .eq('status_aktif', true);

  const rekapKelas = (allKelas || []).map((k: any) => {
    const totalKelasSiswa = k.siswa?.length || 0;
    const kelasReceipts = validReceipts.filter((r) => r.kelas === k.nama_kelas);
    const sudah = kelasReceipts.length;
    const belum = Math.max(0, totalKelasSiswa - sudah);
    const pct = totalKelasSiswa > 0 ? ((sudah / totalKelasSiswa) * 100).toFixed(0) : '0';
    return {
      id: k.id,
      nama_kelas: k.nama_kelas,
      jurusan: k.jurusan,
      tingkat: k.tingkat,
      total: totalKelasSiswa,
      sudah,
      belum,
      persen: Number(pct),
      selesai: totalKelasSiswa > 0 && sudah >= totalKelasSiswa,
    };
  });

  // Rekap Jurusan
  const jurusanMap = new Map<string, { total: number; sudah: number }>();
  for (const k of rekapKelas) {
    const curr = jurusanMap.get(k.jurusan) || { total: 0, sudah: 0 };
    curr.total += k.total;
    curr.sudah += k.sudah;
    jurusanMap.set(k.jurusan, curr);
  }

  const rekapJurusan = Array.from(jurusanMap.entries()).map(([jurusan, val]) => ({
    jurusan,
    total: val.total,
    sudah: val.sudah,
    belum: Math.max(0, val.total - val.sudah),
    persen: val.total > 0 ? ((val.sudah / val.total) * 100).toFixed(0) : '0',
  }));

  // Recent 10 receipts
  const recentActivities = [...(receipts || [])].reverse().slice(0, 10);

  return {
    totalSiswa,
    totalDiterima,
    totalBelum,
    persen: Number(persen),
    totalTidakHadir: tidakHadirCount,
    totalTidakMengambil: tidakMengambilCount,
    waktuPertama,
    waktuTerakhir,
    rekapKelas,
    rekapJurusan,
    recentActivities,
  };
}

