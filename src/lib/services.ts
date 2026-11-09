import { supabase } from './supabase/client';
import {
  DistribusiMBG,
  Kelas,
  PenerimaanMBG,
  Siswa,
  RiwayatAktivitas,
  StatusPenerimaan,
  OrganolepticTest,
  DailyAttendance,
  StudentMbgLog,
  LiveActivityFeedItem,
  ClassMonitoringStatus,
  StudentRecord,
  OrganolepticKesimpulan,
  AttendanceStatus,
} from './types';
import { getJakartaDateString } from './utils';

// ============================================================
// LOCAL STORAGE RESILIENCE HELPERS (OFFLINE-FIRST PWA)
// ============================================================

function getLocalItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// ============================================================
// CORE AUTH & ACTIVITY LOGGING
// ============================================================

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
    console.warn('Audit log notice (offline/rls):', err);
  }
}

// ============================================================
// TAHAP 1: CORE MBG ARRIVAL & ORGANOLEPTIC TEST (DB + OFFLINE-FIRST)
// ============================================================

export async function getTodayOrganolepticSession(): Promise<OrganolepticTest | null> {
  const today = getJakartaDateString();
  try {
    const { data, error } = await supabase
      .from('organoleptic_tests')
      .select('*')
      .eq('tanggal', today)
      .order('dibuat_pada', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      setLocalItem(`mbg_today_session_${today}`, data);
      setLocalItem('mbg_active_session', data);
      return data as OrganolepticTest;
    }
  } catch (e) {
    console.warn('Supabase query error for organoleptic session, using local store:', e);
  }

  // Fallback to local storage (Offline-First)
  const localToday = getLocalItem<OrganolepticTest | null>(`mbg_today_session_${today}`, null);
  if (localToday) return localToday;

  const localActive = getLocalItem<OrganolepticTest | null>('mbg_active_session', null);
  if (localActive && localActive.tanggal === today) return localActive;

  return null;
}

export async function triggerMBGArrivalSession(params: {
  jamTiba: string;
  statusKetepatan: 'TEPAT_WAKTU' | 'TERLAMBAT';
  kesimpulan: OrganolepticKesimpulan;
  statusAroma: string;
  statusRasa: string;
  statusTekstur: string;
  statusWadah: string;
  fotoSampelUrl?: string | null;
  isSampelDisimpan: boolean;
  catatan?: string;
  idSekolah?: string;
  guruPiketId?: string;
}): Promise<OrganolepticTest> {
  const today = getJakartaDateString();
  const dateStr = today.replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const masterQrToken = `MBG-${dateStr}-${randomSuffix}`;
  const kodePinHarian = String(Math.floor(1000 + Math.random() * 9000));

  let userId: string | null = null;
  try {
    const { data: userData } = await supabase.auth.getUser();
    userId = params.guruPiketId || userData?.user?.id || null;
  } catch (e) {
    // ignore
  }

  // 1. Validate Guru Piket ID & Get School ID if not provided
  let validGuruPiketId: string | null = null;
  let schoolId: string | null = params.idSekolah || null;

  if (userId) {
    try {
      const { data: profile } = await supabase
        .from('pengguna')
        .select('id, id_sekolah')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        validGuruPiketId = profile.id;
        if (!schoolId && profile.id_sekolah) {
          schoolId = profile.id_sekolah;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // Fallback to first school if still null (for demo)
  if (!schoolId) {
    try {
      const { data: schools } = await supabase.from('schools').select('id').limit(1);
      if (schools && schools.length > 0 && schools[0].id) {
        schoolId = schools[0].id;
      }
    } catch (e) {
      // ignore
    }
  }
  const finalSchoolId: string = schoolId || SEED_SCHOOL.id;

  // Fallback local session object ready (guaranteed valid UUID & offline-first)
  const localSessionId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;

  const fallbackSession: OrganolepticTest = {
    id: localSessionId,
    id_sekolah: finalSchoolId,
    id_guru_piket: validGuruPiketId || userId || '00000000-0000-0000-0000-000000000000',
    tanggal: today,
    jam_tiba: params.jamTiba,
    master_qr_token: masterQrToken,
    kode_pin_harian: kodePinHarian,
    status_ketepatan: params.statusKetepatan,
    status_aroma: params.statusAroma,
    status_rasa: params.statusRasa,
    status_tekstur: params.statusTekstur,
    status_wadah: params.statusWadah,
    foto_sampel_url: params.fotoSampelUrl || null,
    is_sampel_disimpan: params.isSampelDisimpan,
    catatan_kelayakan: params.catatan || null,
    kesimpulan: params.kesimpulan,
    catatan_kejadian_khusus: null,
    dibuat_pada: new Date().toISOString(),
  };

  let sessionResult: OrganolepticTest = fallbackSession;

  // Try saving to Supabase (Update if today's session already exists, otherwise Insert)
  try {
    const payload: any = {
      id_sekolah: finalSchoolId,
      tanggal: today,
      jam_tiba: params.jamTiba,
      master_qr_token: masterQrToken,
      kode_pin_harian: kodePinHarian,
      status_ketepatan: params.statusKetepatan,
      status_aroma: params.statusAroma,
      status_rasa: params.statusRasa,
      status_tekstur: params.statusTekstur,
      status_wadah: params.statusWadah,
      foto_sampel_url: params.fotoSampelUrl || null,
      is_sampel_disimpan: params.isSampelDisimpan,
      catatan_kelayakan: params.catatan || null,
      kesimpulan: params.kesimpulan,
    };
    if (validGuruPiketId) {
      payload.id_guru_piket = validGuruPiketId;
    }

    const { data: existingRows } = await supabase
      .from('organoleptic_tests')
      .select('id')
      .eq('tanggal', today)
      .order('dibuat_pada', { ascending: false });

    let savedData: any = null;
    let saveError: any = null;

    if (existingRows && existingRows.length > 0) {
      const targetId = existingRows[0].id;
      const { data: updatedRows, error: updErr } = await supabase
        .from('organoleptic_tests')
        .update(payload)
        .eq('tanggal', today)
        .select();
      saveError = updErr;
      savedData = updatedRows?.find((r: any) => r.id === targetId) || updatedRows?.[0] || null;
    }

    if (!savedData) {
      const { data: insertedData, error: insErr } = await supabase
        .from('organoleptic_tests')
        .insert(payload)
        .select()
        .single();
      savedData = insertedData;
      saveError = insErr;
    }

    if (!saveError && savedData) {
      sessionResult = savedData as OrganolepticTest;

      // Ensure Daily Attendances exist for all classes in this school in Supabase
      const { data: existingDa } = await supabase
        .from('daily_attendances')
        .select('id_kelas')
        .eq('id_uji', savedData.id);

      const existingClassIds = new Set((existingDa || []).map((d: any) => d.id_kelas));

      const { data: classes } = await supabase
        .from('classes')
        .select('id, total_siswa_dapodik')
        .eq('id_sekolah', finalSchoolId);

      if (classes && classes.length > 0) {
        const missingClasses = classes.filter((c) => !existingClassIds.has(c.id));
        if (missingClasses.length > 0) {
          const attendances = missingClasses.map((c) => ({
            id_kelas: c.id,
            id_uji: savedData.id,
            tanggal: today,
            jumlah_hadir: 0,
            jumlah_absen: c.total_siswa_dapodik,
            status_ambil: 'MENUNGGU' as AttendanceStatus,
          }));
          await supabase.from('daily_attendances').insert(attendances);
        }
      }
      logActivity('trigger_mbg_arrival', 'organoleptic_tests', savedData.id, null, savedData, validGuruPiketId || userId);
    } else {
      console.warn('Supabase DB notice (RLS/Auth policy): using offline-first local session.', saveError?.message);
    }
  } catch (err: any) {
    console.warn('Supabase insert/update exception, using offline-first local session:', err.message);
  }

  // Always persist session locally so PWA and all pages can access it instantly
  setLocalItem(`mbg_today_session_${today}`, sessionResult);
  setLocalItem('mbg_active_session', sessionResult);

  // Initialize local attendances for classes
  const existingAttendances = getLocalItem<any[]>(`mbg_attendances_${today}`, []);
  if (existingAttendances.length === 0) {
    const initialAttendances = SEED_CLASSES.map((c) => ({
      id: `da-${c.id}-${Date.now()}`,
      id_kelas: c.id,
      id_uji: sessionResult.id,
      tanggal: today,
      jumlah_hadir: 0,
      jumlah_absen: c.total_siswa_dapodik,
      status_ambil: 'MENUNGGU',
      ompreng_utuh: 0,
      ompreng_rusak: 0,
      ompreng_hilang: 0,
      waktu_terima_kelas: null,
      waktu_kembali_ompreng: null,
      classes: c,
    }));
    setLocalItem(`mbg_attendances_${today}`, initialAttendances);
  }

  // Dispatch events to notify UI, student app, and push notification banners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mbg-session-updated', { detail: sessionResult }));
    window.dispatchEvent(
      new CustomEvent('mbg-push-notification', {
        detail: {
          title: '🍽️ MBG Tiba di Sekolah!',
          body: `Distribusi telah dibuka. Master QR & PIN (${kodePinHarian}) siap digunakan.`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      })
    );
  }

  return sessionResult;
}

export async function updateOrganolepticQC(
  session: OrganolepticTest,
  updates: Partial<OrganolepticTest>
): Promise<OrganolepticTest> {
  const updatedSession = { ...session, ...updates };
  try {
    const { data, error } = await supabase
      .from('organoleptic_tests')
      .update(updates)
      .eq('id', session.id)
      .select()
      .maybeSingle();

    if (data && !error) {
      setLocalItem(`mbg_today_session_${session.tanggal}`, data);
      setLocalItem('mbg_active_session', data);
      return data as OrganolepticTest;
    }
  } catch (err: any) {
    console.warn('Supabase update QC notice:', err.message);
  }

  // Fallback to local storage update
  setLocalItem(`mbg_today_session_${session.tanggal}`, updatedSession);
  setLocalItem('mbg_active_session', updatedSession);
  return updatedSession;
}

// ============================================================
// TAHAP 2: MONITORING & REALTIME FEED
// ============================================================

export async function getMonitoringOverview(): Promise<{
  session: OrganolepticTest | null;
  classes: ClassMonitoringStatus[];
  liveActivities: LiveActivityFeedItem[];
  totalPorsiTerserap: number;
  totalPorsiSisa: number;
  totalSiswaSemua: number;
  persenSelesai: number;
}> {
  const today = getJakartaDateString();
  const session = await getTodayOrganolepticSession();

  if (!session) {
    return {
      session: null,
      classes: [],
      liveActivities: [],
      totalPorsiTerserap: 0,
      totalPorsiSisa: 0,
      totalSiswaSemua: 0,
      persenSelesai: 0,
    };
  }

  let attendances: any[] = [];
  let liveLogs: any[] = [];

  // 1. Try Supabase
  try {
    const { data: dbAttendances, error: attError } = await supabase
      .from('daily_attendances')
      .select('*, classes(*)')
      .eq('id_uji', session.id);

    if (!attError && dbAttendances && dbAttendances.length > 0) {
      attendances = dbAttendances;
      const daIds = attendances.map((a) => a.id);
      if (daIds.length > 0) {
        const { data: allLogs } = await supabase
          .from('student_mbg_logs')
          .select('*, daily_attendances!inner(classes(nama_kelas))')
          .in('id_log', daIds)
          .order('waktu_ambil', { ascending: false })
          .limit(20);
        liveLogs = allLogs || [];
      }
    }
  } catch (e) {
    console.warn('Supabase monitoring fetch notice:', e);
  }

  // 2. If Supabase has no attendances or errored, load from localStorage
  if (attendances.length === 0) {
    const localAtt = getLocalItem<any[]>(`mbg_attendances_${today}`, []);
    if (localAtt.length > 0) {
      attendances = localAtt;
    } else {
      // Initialize from SEED_CLASSES
      attendances = SEED_CLASSES.map((c) => ({
        id: `da-${c.id}`,
        id_kelas: c.id,
        id_uji: session.id,
        tanggal: today,
        jumlah_hadir: 0,
        jumlah_absen: c.total_siswa_dapodik,
        status_ambil: 'MENUNGGU',
        classes: c,
      }));
    }
  }

  // Load local live logs if liveLogs is empty
  if (liveLogs.length === 0) {
    const localLogs = getLocalItem<any[]>(`mbg_logs_${today}`, []);
    liveLogs = localLogs;
  }

  let totalSiswaSemua = 0;
  let totalPorsiTerserap = 0;

  const classes: ClassMonitoringStatus[] = attendances.map((da: any) => {
    const c = da.classes || SEED_CLASSES.find((sc) => sc.id === da.id_kelas) || {
      id: da.id_kelas,
      nama_kelas: 'Kelas',
      jurusan: 'UMUM',
      tingkat: 'X',
      total_siswa_dapodik: 36,
    };
    const hadir = da.jumlah_hadir || 0;
    const total = c.total_siswa_dapodik || 36;
    const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;

    totalSiswaSemua += total;
    totalPorsiTerserap += hadir;

    return {
      id_kelas: c.id,
      nama_kelas: c.nama_kelas,
      jurusan: c.jurusan,
      tingkat: c.tingkat,
      total_siswa: total,
      jumlah_hadir: hadir,
      jumlah_absen: da.jumlah_absen !== undefined ? da.jumlah_absen : Math.max(0, total - hadir),
      status_ambil: da.status_ambil || 'MENUNGGU',
      persen,
      waktu_terima: da.waktu_terima_kelas,
    };
  });

  const liveActivities: LiveActivityFeedItem[] = liveLogs.map((l: any) => {
    const className = l.daily_attendances?.classes?.nama_kelas || l.nama_kelas || 'Kelas';
    const time = l.waktu || (l.waktu_ambil ? new Date(l.waktu_ambil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '10:00');
    return {
      id: l.id || `act-${Math.random()}`,
      nama_kelas: className,
      deskripsi:
        l.deskripsi ||
        (l.tipe_klaim === 'KOLEKTIF_KELAS'
          ? `${className} baru saja mengambil porsi kolektif (${time} WIB)`
          : `${l.nama_siswa_snapshot || 'Siswa'} (${className}) klaim porsi mandiri (${time} WIB)`),
      waktu: time,
      tipe: l.tipe_klaim || 'KOLEKTIF_KELAS',
      jumlah_porsi: l.jumlah_porsi || 1,
    };
  });

  const totalPorsiSisa = Math.max(0, totalSiswaSemua - totalPorsiTerserap);
  const persenSelesai = totalSiswaSemua > 0 ? Math.round((totalPorsiTerserap / totalSiswaSemua) * 100) : 0;

  return {
    session,
    classes,
    liveActivities,
    totalPorsiTerserap,
    totalPorsiSisa,
    totalSiswaSemua,
    persenSelesai,
  };
}

// ============================================================
// TAHAP 3: STUDENT INTERACTION (RPC + DUAL VERIFICATION)
// ============================================================

export function extractTokenFromInput(rawInput: string): string {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return '';

  // 1. Jika terdapat pola token MBG-YYYYMMDD-XXXX langsung di dalam string/URL, prioritaskan!
  const mbgPattern = trimmed.match(/MBG-\d{8}-[A-Z0-9]+/i);
  if (mbgPattern?.[0]) {
    return mbgPattern[0].toUpperCase();
  }

  // 2. Jika input berasal dari Deep-Link URL QR Scanner Eksternal (http/https atau query param)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('?')) {
    try {
      const urlObj = trimmed.startsWith('http')
        ? new URL(trimmed)
        : new URL(trimmed, 'http://localhost');
      const tokenParam =
        urlObj.searchParams.get('token') ||
        urlObj.searchParams.get('qr') ||
        urlObj.searchParams.get('pin') ||
        urlObj.searchParams.get('code');
      if (tokenParam) {
        return tokenParam.trim();
      }
    } catch {
      const match = trimmed.match(/[?&](?:token|qr|pin|code)=([^&#\s]+)/i);
      if (match?.[1]) {
        return decodeURIComponent(match[1]).trim();
      }
    }
  }

  return trimmed;
}

export async function verifyStudentPinOrQr(tokenOrPin: string): Promise<{
  valid: boolean;
  message: string;
  session?: OrganolepticTest;
}> {
  const today = getJakartaDateString();
  const extracted = extractTokenFromInput(tokenOrPin);
  const clean = extracted.toUpperCase();

  if (!clean) {
    return {
      valid: false,
      message: 'Kode PIN atau QR tidak boleh kosong.',
    };
  }

  // Extract optional PIN parameter if raw input was a full URL (?token=...&pin=...)
  let urlPin = '';
  try {
    const pinMatchUrl = tokenOrPin.match(/[?&]pin=(\d{4})/i);
    if (pinMatchUrl?.[1]) urlPin = pinMatchUrl[1];
  } catch {
    // ignore
  }

  let session = await getTodayOrganolepticSession();

  // Jika session lokal/default tidak cocok dengan token yang di-scan, cari langsung di Supabase berdasarkan token/PIN
  if (
    !session ||
    (clean !== session.kode_pin_harian && clean !== session.master_qr_token.toUpperCase())
  ) {
    try {
      const { data: matchedRow } = await supabase
        .from('organoleptic_tests')
        .select('*')
        .or(`master_qr_token.ilike.${clean},kode_pin_harian.eq.${clean}`)
        .order('dibuat_pada', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (matchedRow) {
        session = matchedRow as OrganolepticTest;
        setLocalItem(`mbg_today_session_${today}`, session);
        setLocalItem('mbg_active_session', session);
      }
    } catch {
      // ignore Supabase error and continue to cross-device token check
    }
  }

  // Fallback Lintas Perangkat / Isolated QR Scanner WebView:
  // Jika token berformat resmi Master QR (MBG-YYYYMMDD-XXXX), sinkronkan sesi aktif pada perangkat siswa
  const isValidMbgQrFormat = /^MBG-\d{8}-[A-Z0-9]{3,10}$/i.test(clean);
  if (
    isValidMbgQrFormat &&
    (!session || clean !== session.master_qr_token.toUpperCase())
  ) {
    const now = new Date();
    const hhMm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const syncedSession: OrganolepticTest = {
      id:
        session?.id ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`),
      id_sekolah: session?.id_sekolah || SEED_SCHOOL.id,
      id_guru_piket: session?.id_guru_piket || '00000000-0000-0000-0000-000000000000',
      tanggal: today,
      jam_tiba: session?.jam_tiba || hhMm,
      master_qr_token: clean,
      kode_pin_harian: urlPin || session?.kode_pin_harian || '1234',
      status_ketepatan: session?.status_ketepatan || 'TEPAT_WAKTU',
      status_aroma: session?.status_aroma || 'Harum Segar (SOP)',
      status_rasa: session?.status_rasa || 'Gurih Sesuai Standar',
      status_tekstur: session?.status_tekstur || 'Matang Sempurna & Renyah',
      status_wadah: session?.status_wadah || 'Bersih, Rapat & Higienis',
      foto_sampel_url: session?.foto_sampel_url || null,
      is_sampel_disimpan: session?.is_sampel_disimpan ?? true,
      catatan_kelayakan: session?.catatan_kelayakan || null,
      kesimpulan: session?.kesimpulan || 'LAYAK_EDAR',
      catatan_kejadian_khusus: session?.catatan_kejadian_khusus || null,
      dibuat_pada: session?.dibuat_pada || new Date().toISOString(),
    };
    session = syncedSession;
    setLocalItem(`mbg_today_session_${today}`, syncedSession);
    setLocalItem('mbg_active_session', syncedSession);
  }

  if (!session) {
    return {
      valid: false,
      message: 'MBG hari ini belum dibuka oleh Guru Piket.',
    };
  }

  if (session.kesimpulan === 'TOLAK_RETUR') {
    return {
      valid: false,
      message: 'Distribusi hari ini dibatalkan (Makanan Tidak Layak).',
    };
  }

  const pinMatch = clean === session.kode_pin_harian || (!!urlPin && urlPin === session.kode_pin_harian);
  const qrMatch = clean === session.master_qr_token.toUpperCase();

  if (!pinMatch && !qrMatch) {
    return {
      valid: false,
      message: 'Kode PIN atau QR tidak valid.',
    };
  }

  return {
    valid: true,
    message: 'Verifikasi berhasil!',
    session,
  };
}

export async function searchStudentsForConfirmation(
  searchQuery: string,
  kelasId?: string,
  jurusan?: string
): Promise<CandidateStudent[]> {
  try {
    const { data, error } = await supabase.rpc('cari_siswa_konfirmasi', {
      p_nama: searchQuery || null,
      p_kelas_id: kelasId || null,
      p_jurusan: jurusan || null,
    });

    if (!error && data && data.length > 0) {
      return data.map((s: any) => ({
        id: s.nisn,
        nama: s.nama_lengkap,
        nama_kelas: s.nama_kelas,
        jurusan: s.jurusan,
        sudah_menerima: s.sudah_menerima,
        waktu_penerimaan: s.waktu_penerimaan,
      }));
    }
  } catch (error) {
    console.warn('Search RPC notice:', error);
  }

  // Fallback to local students search
  let pool = SEED_STUDENTS;
  if (kelasId) {
    pool = pool.filter((s) => s.id_kelas === kelasId);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    pool = pool.filter((s) => s.nama_lengkap.toLowerCase().includes(q) || s.nisn.includes(q));
  }
  return pool.map((s) => ({
    id: s.nisn,
    nama: s.nama_lengkap,
    nama_kelas: s.nama_kelas,
    jurusan: s.jurusan,
    sudah_menerima: s.sudah_ambil,
    waktu_penerimaan: s.waktu_ambil,
  }));
}

export async function getClassRoster(classId: string): Promise<StudentRecord[]> {
  const localRosterKey = `mbg_roster_${classId}`;
  const localRoster = getLocalItem<StudentRecord[]>(localRosterKey, []);

  // Try Supabase first
  try {
    const results = await searchStudentsForConfirmation('', classId);
    const statusMap = new Map(results.map((r) => [r.id, r]));

    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('id_kelas', classId)
      .eq('status_aktif', true)
      .order('nama_lengkap');

    if (students && students.length > 0) {
      return students.map((s) => {
        const status = statusMap.get(s.nisn);
        const localStudent = localRoster.find((lr) => lr.nisn === s.nisn);
        const isClaimed = status?.sudah_menerima || localStudent?.sudah_ambil || false;
        return {
          nisn: s.nisn,
          nama_lengkap: s.nama_lengkap,
          id_kelas: s.id_kelas,
          nama_kelas: status?.nama_kelas || '',
          jurusan: s.jurusan || '',
          alergi_makanan: s.alergi_makanan,
          is_perwakilan_kelas: s.is_perwakilan_kelas,
          sudah_ambil: isClaimed,
          waktu_ambil: status?.waktu_penerimaan || localStudent?.waktu_ambil || null,
        };
      });
    }
  } catch (err: any) {
    console.warn('Supabase getClassRoster notice:', err.message);
  }

  // Fallback to local storage or SEED_STUDENTS
  if (localRoster.length > 0) {
    return localRoster;
  }

  const fallbackStudents = SEED_STUDENTS.filter((s) => s.id_kelas === classId);
  return fallbackStudents;
}

export async function submitClassRepresentativeClaim(params: {
  classId: string;
  attendedNisns: string[];
  pinOrToken: string;
  ttdPerwakilan?: string;
  perwakilanNisn?: string;
}): Promise<{
  success: boolean;
  message: string;
  berhasilCount: number;
  dilewatiCount: number;
}> {
  const check = await verifyStudentPinOrQr(params.pinOrToken);
  if (!check.valid || !check.session) {
    return { success: false, message: check.message, berhasilCount: 0, dilewatiCount: 0 };
  }

  const today = getJakartaDateString();
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const nowIso = new Date().toISOString();
  let berhasilCount = params.attendedNisns.length;
  let dilewatiCount = 0;
  let responseMsg = '';

  try {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase.rpc('konfirmasi_massal_kelas', {
      p_id_uji: check.session.id,
      p_id_kelas: params.classId,
      p_nisn_list: params.attendedNisns,
      p_tipe_klaim: 'KOLEKTIF_KELAS',
      p_petugas_id: userData?.user?.id || null,
    });

    if (!error && data && data.success) {
      berhasilCount = data.berhasil ?? params.attendedNisns.length;
      dilewatiCount = data.dilewati ?? 0;
      responseMsg = data.message || `Berhasil mencatat ${berhasilCount} porsi.`;
    }
  } catch (err: any) {
    console.warn('Supabase RPC konfirmasi_massal_kelas notice, switching to local store:', err.message);
  }

  // Always update local storage for offline-first resilience
  const targetClass = SEED_CLASSES.find((c) => c.id === params.classId);
  const className = targetClass?.nama_kelas || 'Kelas';

  // 1. Update attendances
  const localAtt = getLocalItem<any[]>(`mbg_attendances_${today}`, []);
  const classIndex = localAtt.findIndex((a) => a.id_kelas === params.classId);
  const totalStudents = targetClass?.total_siswa_dapodik || 36;

  if (classIndex >= 0) {
    localAtt[classIndex].status_ambil = 'SUDAH_TERIMA_MBG';
    localAtt[classIndex].jumlah_hadir = berhasilCount;
    localAtt[classIndex].jumlah_absen = Math.max(0, totalStudents - berhasilCount);
    localAtt[classIndex].waktu_terima_kelas = nowIso;
    if (params.ttdPerwakilan) localAtt[classIndex].ttd_perwakilan_siswa = params.ttdPerwakilan;
  } else {
    localAtt.push({
      id: `da-${params.classId}-${Date.now()}`,
      id_kelas: params.classId,
      id_uji: check.session.id,
      tanggal: today,
      jumlah_hadir: berhasilCount,
      jumlah_absen: Math.max(0, totalStudents - berhasilCount),
      status_ambil: 'SUDAH_TERIMA_MBG',
      waktu_terima_kelas: nowIso,
      ttd_perwakilan_siswa: params.ttdPerwakilan || null,
      classes: targetClass,
    });
  }
  setLocalItem(`mbg_attendances_${today}`, localAtt);

  // 2. Update student roster records in localStorage
  const localRosterKey = `mbg_roster_${params.classId}`;
  const currentRoster = getLocalItem<StudentRecord[]>(localRosterKey, []);
  const baseStudents = currentRoster.length > 0 ? currentRoster : SEED_STUDENTS.filter((s) => s.id_kelas === params.classId);
  const updatedStudents = baseStudents.map((s) => {
    if (params.attendedNisns.includes(s.nisn)) {
      return { ...s, sudah_ambil: true, waktu_ambil: nowIso };
    }
    return s;
  });
  setLocalItem(localRosterKey, updatedStudents);

  // 3. Append to live activity logs in localStorage
  const localLogs = getLocalItem<any[]>(`mbg_logs_${today}`, []);
  localLogs.unshift({
    id: `log-${Date.now()}`,
    nama_kelas: className,
    deskripsi: `${className} baru saja mengambil ${berhasilCount} porsi kolektif (${timeStr} WIB)`,
    waktu: timeStr,
    waktu_ambil: nowIso,
    tipe_klaim: 'KOLEKTIF_KELAS',
    jumlah_porsi: berhasilCount,
  });
  setLocalItem(`mbg_logs_${today}`, localLogs.slice(0, 30));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mbg-live-activity'));
  }

  return {
    success: true,
    message: responseMsg || `Berhasil mengonfirmasi ${berhasilCount} siswa untuk ${className}.`,
    berhasilCount,
    dilewatiCount,
  };
}

export async function submitIndividualStudentClaim(params: {
  nisn: string;
  pinOrToken: string;
  tipeKlaim?: 'MANDIRI' | 'SUSULAN';
}): Promise<{
  success: boolean;
  message: string;
  already_received?: boolean;
  waktu_ambil?: string;
  nama_siswa?: string;
  kelas?: string;
}> {
  const check = await verifyStudentPinOrQr(params.pinOrToken);
  if (!check.valid || !check.session) {
    return { success: false, message: check.message };
  }

  const today = getJakartaDateString();
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const nowIso = new Date().toISOString();

  // Try Supabase RPC
  try {
    const { data, error } = await supabase.rpc('konfirmasi_penerimaan_siswa', {
      p_nisn: params.nisn,
    });
    if (!error && data) {
      return {
        success: data.success,
        message: data.message,
        already_received: data.already_received,
        waktu_ambil: data.waktu_penerimaan,
        nama_siswa: data.nama_siswa,
        kelas: data.kelas,
      };
    }
  } catch (err: any) {
    console.warn('Supabase konfirmasi_penerimaan_siswa notice:', err.message);
  }

  // Fallback to local storage
  const student = SEED_STUDENTS.find((s) => s.nisn === params.nisn);
  const studentName = student?.nama_lengkap || 'Siswa';
  const targetClass = SEED_CLASSES.find((c) => c.id === student?.id_kelas);
  const className = targetClass?.nama_kelas || 'Kelas';

  // Check if already claimed locally
  const localRosterKey = student ? `mbg_roster_${student.id_kelas}` : '';
  if (localRosterKey) {
    const roster = getLocalItem<StudentRecord[]>(localRosterKey, []);
    const found = roster.find((s) => s.nisn === params.nisn);
    if (found?.sudah_ambil) {
      return {
        success: false,
        already_received: true,
        message: 'Anda sudah tercatat menerima MBG hari ini.',
        waktu_ambil: found.waktu_ambil || timeStr,
        nama_siswa: studentName,
        kelas: className,
      };
    }

    // Mark student as received
    const baseList = roster.length > 0 ? roster : SEED_STUDENTS.filter((s) => s.id_kelas === student?.id_kelas);
    const updated = baseList.map((s) => (s.nisn === params.nisn ? { ...s, sudah_ambil: true, waktu_ambil: nowIso } : s));
    setLocalItem(localRosterKey, updated);
  }

  // Append log
  const localLogs = getLocalItem<any[]>(`mbg_logs_${today}`, []);
  localLogs.unshift({
    id: `log-${Date.now()}`,
    nama_kelas: className,
    nama_siswa_snapshot: studentName,
    deskripsi: `${studentName} (${className}) klaim porsi mandiri (${timeStr} WIB)`,
    waktu: timeStr,
    waktu_ambil: nowIso,
    tipe_klaim: params.tipeKlaim || 'MANDIRI',
    jumlah_porsi: 1,
  });
  setLocalItem(`mbg_logs_${today}`, localLogs.slice(0, 30));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mbg-live-activity'));
  }

  return {
    success: true,
    message: 'Penerimaan MBG berhasil dicatat.',
    nama_siswa: studentName,
    kelas: className,
    waktu_ambil: nowIso,
  };
}

// ============================================================
// REALTIME SUBSCRIPTION HELPERS
// ============================================================

export function subscribeToLiveUpdates(callback: () => void) {
  const channel = supabase
    .channel('public:student_mbg_logs')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'student_mbg_logs' }, () => callback())
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'daily_attendances' }, () => callback())
    .subscribe();

  // Also listen to local window event for offline-first sync
  const handleLocalActivity = () => callback();
  if (typeof window !== 'undefined') {
    window.addEventListener('mbg-live-activity', handleLocalActivity);
    window.addEventListener('mbg-session-updated', handleLocalActivity);
  }

  return () => {
    supabase.removeChannel(channel);
    if (typeof window !== 'undefined') {
      window.removeEventListener('mbg-live-activity', handleLocalActivity);
      window.removeEventListener('mbg-session-updated', handleLocalActivity);
    }
  };
}

// ============================================================
// BACKWARD COMPATIBILITY & UTILS
// ============================================================

export async function getTodayDistribution(): Promise<DistribusiMBG | null> {
  const session = await getTodayOrganolepticSession();
  if (!session) return null;
  return {
    id: session.id,
    tanggal: session.tanggal,
    status: session.kesimpulan === 'LAYAK_EDAR' ? 'tiba' : 'ditutup',
    waktu_kedatangan: session.jam_tiba,
    waktu_input: session.dibuat_pada,
    petugas_id: session.id_guru_piket,
    keterangan: session.catatan_kelayakan,
    dibuat_pada: session.dibuat_pada,
    diperbarui_pada: session.dibuat_pada,
  };
}

export async function ensureTodayDistribution(petugasId?: string): Promise<DistribusiMBG> {
  const existing = await getTodayDistribution();
  if (existing) return existing;
  const today = getJakartaDateString();
  return {
    id: `temp-${today}`,
    tanggal: today,
    status: 'menunggu',
    waktu_kedatangan: null,
    waktu_input: null,
    petugas_id: petugasId || null,
    keterangan: null,
    dibuat_pada: new Date().toISOString(),
    diperbarui_pada: new Date().toISOString(),
  };
}

export async function markMBGArrival(params: {
  distribusiId: string;
  waktuKedatangan: string;
  keterangan?: string;
  petugasId: string;
}): Promise<DistribusiMBG> {
  const time = new Date(params.waktuKedatangan).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  await triggerMBGArrivalSession({
    jamTiba: time,
    statusKetepatan: 'TEPAT_WAKTU',
    kesimpulan: 'LAYAK_EDAR',
    statusAroma: 'Harum Segar (SOP)',
    statusRasa: 'Gurih Sesuai Standar',
    statusTekstur: 'Matang Sempurna',
    statusWadah: 'Bersih, Rapat & Higienis',
    isSampelDisimpan: true,
    catatan: params.keterangan,
    guruPiketId: params.petugasId,
  });
  return getTodayDistribution() as any;
}

export async function closeTodayDistribution(distribusiId: string, petugasId: string): Promise<DistribusiMBG> {
  const session = await getTodayOrganolepticSession();
  if (session) {
    await updateOrganolepticQC(session, { kesimpulan: 'TOLAK_RETUR' });
  }
  return getTodayDistribution() as any;
}

export async function getDashboardStatistics(distribusiId?: string) {
  const overview = await getMonitoringOverview();
  return {
    totalSiswa: overview.totalSiswaSemua,
    totalDiterima: overview.totalPorsiTerserap,
    totalBelum: overview.totalPorsiSisa,
    persen: overview.persenSelesai,
    totalTidakHadir: overview.totalPorsiSisa,
    totalTidakMengambil: 0,
    waktuPertama: overview.classes.find((c) => c.waktu_terima)?.waktu_terima || null,
    waktuTerakhir: null,
    rekapKelas: overview.classes.map((c) => ({
      id: c.id_kelas,
      nama_kelas: c.nama_kelas,
      jurusan: c.jurusan,
      tingkat: c.tingkat,
      total: c.total_siswa,
      sudah: c.jumlah_hadir,
      belum: c.jumlah_absen,
      persen: c.persen,
      selesai: c.jumlah_hadir >= c.total_siswa && c.total_siswa > 0,
    })),
    rekapJurusan: [],
    recentActivities: overview.liveActivities,
  };
}

export async function confirmStudentSelf(studentId: string) {
  const session = await getTodayOrganolepticSession();
  return submitIndividualStudentClaim({
    nisn: studentId,
    pinOrToken: session?.kode_pin_harian || '',
  });
}

// ============================================================
// CONSTANTS & SEED DATA (OFFLINE-FIRST)
// ============================================================

export const SEED_SCHOOL = {
  id: '11111111-1111-1111-1111-111111111111',
  npsn: '20220101',
  nama_sekolah: 'SMK Bina Sarana Informatika (UBSI Center)',
  nama_kepala_sekolah: 'Dr. Mochamad Wahyudi, M.M',
  nip_kepala_sekolah: '197508122005011002',
  nama_sppg_mitra: 'SPPG Sehat Barokah',
};

export const SEED_CLASSES = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    id_sekolah: '11111111-1111-1111-1111-111111111111',
    nama_kelas: 'XII RPL 1',
    tingkat: 'XII',
    jurusan: 'RPL',
    total_siswa_dapodik: 25,
    status_aktif: true,
    dibuat_pada: '',
    diperbarui_pada: '',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    id_sekolah: '11111111-1111-1111-1111-111111111111',
    nama_kelas: 'XII RPL 2',
    tingkat: 'XII',
    jurusan: 'RPL',
    total_siswa_dapodik: 25,
    status_aktif: true,
    dibuat_pada: '',
    diperbarui_pada: '',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    id_sekolah: '11111111-1111-1111-1111-111111111111',
    nama_kelas: 'XII TKJ 1',
    tingkat: 'XII',
    jurusan: 'TKJ',
    total_siswa_dapodik: 17,
    status_aktif: true,
    dibuat_pada: '',
    diperbarui_pada: '',
  },
];

export const SEED_STUDENTS: StudentRecord[] = [
  {
    nisn: '1000000001',
    nama_lengkap: 'Alroy Theola Ardanta',
    id_kelas: '22222222-2222-2222-2222-222222222222',
    nama_kelas: 'XII RPL 1',
    jurusan: 'RPL',
    alergi_makanan: '⚠️ Alergi Kacang & Seafood',
    is_perwakilan_kelas: true,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '1000000002',
    nama_lengkap: 'Annisa Rahmawati',
    id_kelas: '22222222-2222-2222-2222-222222222222',
    nama_kelas: 'XII RPL 1',
    jurusan: 'RPL',
    alergi_makanan: null,
    is_perwakilan_kelas: false,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '1000000003',
    nama_lengkap: 'Bagas Pratama',
    id_kelas: '22222222-2222-2222-2222-222222222222',
    nama_kelas: 'XII RPL 1',
    jurusan: 'RPL',
    alergi_makanan: '⚠️ Alergi Telur',
    is_perwakilan_kelas: false,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '1000000004',
    nama_lengkap: 'Cantika Dewi',
    id_kelas: '22222222-2222-2222-2222-222222222222',
    nama_kelas: 'XII RPL 1',
    jurusan: 'RPL',
    alergi_makanan: null,
    is_perwakilan_kelas: false,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '1000000005',
    nama_lengkap: 'Dimas Aditya',
    id_kelas: '22222222-2222-2222-2222-222222222222',
    nama_kelas: 'XII RPL 1',
    jurusan: 'RPL',
    alergi_makanan: null,
    is_perwakilan_kelas: false,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '1000000006',
    nama_lengkap: 'Eka Putri Lestari',
    id_kelas: '22222222-2222-2222-2222-222222222222',
    nama_kelas: 'XII RPL 1',
    jurusan: 'RPL',
    alergi_makanan: '⚠️ Alergi Susu Sapi (Laktosa)',
    is_perwakilan_kelas: false,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '1000000026',
    nama_lengkap: 'Joko Prabowo',
    id_kelas: '33333333-3333-3333-3333-333333333333',
    nama_kelas: 'XII RPL 2',
    jurusan: 'RPL',
    alergi_makanan: null,
    is_perwakilan_kelas: true,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '1000000027',
    nama_lengkap: 'Kurnia Ramadhan',
    id_kelas: '33333333-3333-3333-3333-333333333333',
    nama_kelas: 'XII RPL 2',
    jurusan: 'RPL',
    alergi_makanan: '⚠️ Alergi Udang',
    is_perwakilan_kelas: false,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '1000000051',
    nama_lengkap: 'Olivia Zahra',
    id_kelas: '44444444-4444-4444-4444-444444444444',
    nama_kelas: 'XII TKJ 1',
    jurusan: 'TKJ',
    alergi_makanan: null,
    is_perwakilan_kelas: true,
    sudah_ambil: false,
    waktu_ambil: null,
  },
];

export interface CandidateStudent {
  id: string;
  nama: string;
  nama_kelas: string;
  jurusan: string;
  sudah_menerima: boolean;
  waktu_penerimaan?: string | null;
}
