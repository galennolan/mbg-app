import { supabase } from './supabase/client';
import {
  School,
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
  CrmCampaign,
  StudentAuthProfile,
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

export function getActiveSchoolIdFromStorage(overrideSchoolId?: string): string {
  if (overrideSchoolId) return overrideSchoolId;
  if (typeof window !== 'undefined') {
    const activeSwitch = localStorage.getItem('mbg_active_school_id');
    if (activeSwitch) return activeSwitch;
    try {
      const staffRaw = localStorage.getItem('mbg_staff_session');
      if (staffRaw) {
        const parsed = JSON.parse(staffRaw);
        if (parsed?.id_sekolah) return parsed.id_sekolah;
      }
    } catch {
      // ignore
    }
  }
  return '11111111-1111-1111-1111-111111111111';
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
  const nowIso = new Date().toISOString();
  const localEntry: RiwayatAktivitas = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `audit-${Date.now()}`,
    pengguna_id: penggunaId,
    aktivitas,
    tabel_terkait: tabelTerkait,
    data_id: dataId,
    data_sebelum: dataSebelum,
    data_sesudah: dataSesudah,
    waktu_aktivitas: nowIso,
  };

  const existingLocal = getLocalItem<RiwayatAktivitas[]>('mbg_audit_logs', []);
  setLocalItem('mbg_audit_logs', [localEntry, ...existingLocal].slice(0, 100));

  try {
    const isUuid = (val: string | null) =>
      !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    await supabase.from('riwayat_aktivitas').insert({
      aktivitas,
      tabel_terkait: tabelTerkait,
      data_id: isUuid(dataId) ? dataId : null,
      data_sebelum: dataSebelum,
      data_sesudah: dataSesudah,
      pengguna_id: isUuid(penggunaId) ? penggunaId : null,
      waktu_aktivitas: nowIso,
    });
  } catch (err) {
    console.warn('Audit log notice (offline/rls):', err);
  }
}

// ============================================================
// TAHAP 1: CORE MBG ARRIVAL & ORGANOLEPTIC TEST (DB + OFFLINE-FIRST)
// ============================================================

export async function getTodayOrganolepticSession(
  schoolId?: string
): Promise<OrganolepticTest | null> {
  const today = getJakartaDateString();
  const targetSchoolId = getActiveSchoolIdFromStorage(schoolId);
  try {
    let query = supabase
      .from('organoleptic_tests')
      .select('*')
      .eq('tanggal', today)
      .eq('id_sekolah', targetSchoolId)
      .order('dibuat_pada', { ascending: false })
      .limit(1);

    const { data, error } = await query.maybeSingle();

    if (data && !error) {
      setLocalItem(`mbg_today_session_${today}_${targetSchoolId}`, data);
      setLocalItem(`mbg_today_session_${today}`, data);
      setLocalItem('mbg_active_session', data);
      return data as OrganolepticTest;
    }
  } catch (e) {
    console.warn('Supabase query error for organoleptic session, using local store:', e);
  }

  // Fallback to local storage (Offline-First)
  const localBySchool = getLocalItem<OrganolepticTest | null>(
    `mbg_today_session_${today}_${targetSchoolId}`,
    null
  );
  if (localBySchool) return localBySchool;

  const localToday = getLocalItem<OrganolepticTest | null>(`mbg_today_session_${today}`, null);
  if (localToday && (!schoolId || localToday.id_sekolah === targetSchoolId)) return localToday;

  const localActive = getLocalItem<OrganolepticTest | null>('mbg_active_session', null);
  if (
    localActive &&
    localActive.tanggal === today &&
    (!schoolId || localActive.id_sekolah === targetSchoolId)
  ) {
    return localActive;
  }

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
  setLocalItem(`mbg_today_session_${today}_${finalSchoolId}`, sessionResult);
  setLocalItem(`mbg_today_session_${today}`, sessionResult);
  setLocalItem('mbg_active_session', sessionResult);

  // Initialize local attendances for classes of this school
  const schoolClasses = SEED_CLASSES.filter((c) => c.id_sekolah === finalSchoolId);
  const targetClassesForInit = schoolClasses.length > 0 ? schoolClasses : SEED_CLASSES;
  const existingAttendances = getLocalItem<any[]>(`mbg_attendances_${today}`, []);
  const hasSchoolAtt = existingAttendances.some(
    (a) => a.classes?.id_sekolah === finalSchoolId || targetClassesForInit.some((c) => c.id === a.id_kelas)
  );
  if (!hasSchoolAtt) {
    const initialAttendances = targetClassesForInit.map((c) => ({
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
    setLocalItem(`mbg_attendances_${today}`, [...existingAttendances, ...initialAttendances]);
  }

  // Dispatch events to notify UI, student app, and push notification banners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mbg-session-updated', { detail: sessionResult }));
    window.dispatchEvent(
      new CustomEvent('mbg-push-notification', {
        detail: {
          title: 'MBG Tiba di Sekolah!',
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
      setLocalItem(`mbg_today_session_${session.tanggal}_${session.id_sekolah}`, data);
      setLocalItem(`mbg_today_session_${session.tanggal}`, data);
      setLocalItem('mbg_active_session', data);
      return data as OrganolepticTest;
    }
  } catch (err: any) {
    console.warn('Supabase update QC notice:', err.message);
  }

  // Fallback to local storage update
  setLocalItem(`mbg_today_session_${session.tanggal}_${session.id_sekolah}`, updatedSession);
  setLocalItem(`mbg_today_session_${session.tanggal}`, updatedSession);
  setLocalItem('mbg_active_session', updatedSession);
  return updatedSession;
}

// ============================================================
// TAHAP 2: MONITORING & REALTIME FEED
// ============================================================

export async function getMonitoringOverview(schoolId?: string): Promise<{
  session: OrganolepticTest | null;
  classes: ClassMonitoringStatus[];
  liveActivities: LiveActivityFeedItem[];
  totalPorsiTerserap: number;
  totalPorsiSisa: number;
  totalSiswaSemua: number;
  persenSelesai: number;
}> {
  const today = getJakartaDateString();
  const targetSchoolId = getActiveSchoolIdFromStorage(schoolId);
  const session = await getTodayOrganolepticSession(targetSchoolId);
  const schoolClasses = await getClassesBySchool(targetSchoolId);

  let attendances: any[] = [];
  let liveLogs: any[] = [];

  // 1. Try Supabase if session exists
  if (session) {
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
  }

  // 2. If Supabase has no attendances or errored, load from localStorage filtered by school classes
  const schoolClassIds = new Set(schoolClasses.map((c) => c.id));
  if (attendances.length === 0) {
    const localAtt = getLocalItem<any[]>(`mbg_attendances_${today}`, []).filter((a) =>
      schoolClassIds.has(a.id_kelas)
    );
    if (localAtt.length > 0) {
      attendances = localAtt;
    } else {
      attendances = schoolClasses.map((c) => ({
        id: `da-${c.id}`,
        id_kelas: c.id,
        id_uji: session?.id || 'pending',
        tanggal: today,
        jumlah_hadir: 0,
        jumlah_absen: c.total_siswa_dapodik || 30,
        status_ambil: 'MENUNGGU',
        classes: c,
      }));
    }
  }

  // Load local live logs if liveLogs is empty
  if (liveLogs.length === 0) {
    const schoolClassNames = new Set(schoolClasses.map((c) => c.nama_kelas));
    const localLogs = getLocalItem<any[]>(`mbg_logs_${today}`, []).filter(
      (l) => !l.nama_kelas || schoolClassNames.has(l.nama_kelas)
    );
    liveLogs = localLogs;
  }

  let totalSiswaSemua = 0;
  let totalPorsiTerserap = 0;

  const classes: ClassMonitoringStatus[] = attendances.map((da: any) => {
    const c =
      da.classes ||
      schoolClasses.find((sc) => sc.id === da.id_kelas) ||
      SEED_CLASSES.find((sc) => sc.id === da.id_kelas) || {
        id: da.id_kelas,
        nama_kelas: 'Kelas',
        jurusan: 'UMUM',
        tingkat: 'X',
        total_siswa_dapodik: 30,
      };
    const hadir = da.jumlah_hadir || 0;
    const total = c.total_siswa_dapodik || 30;
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
      waktu_terima: da.waktu_terima_kelas || null,
    };
  });

  const liveActivities: LiveActivityFeedItem[] = liveLogs.map((l: any) => {
    const className = l.daily_attendances?.classes?.nama_kelas || l.nama_kelas || 'Kelas';
    const time =
      l.waktu ||
      (l.waktu_ambil
        ? new Date(l.waktu_ambil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '10:00');
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
  const persenSelesai =
    totalSiswaSemua > 0 ? Math.round((totalPorsiTerserap / totalSiswaSemua) * 100) : 0;

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

export async function getTodayDistribution(schoolId?: string): Promise<DistribusiMBG | null> {
  const session = await getTodayOrganolepticSession(schoolId);
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
// CONSTANTS & SEED DATA (OFFLINE-FIRST MULTI-TENANT)
// ============================================================

export const SEED_SCHOOL: School = {
  id: '11111111-1111-1111-1111-111111111111',
  npsn: '20220101',
  nama_sekolah: 'SMK Bina Sarana Informatika (UBSI Center)',
  nama_kepala_sekolah: 'Dr. Mochamad Wahyudi, M.M',
  nip_kepala_sekolah: '197508122005011002',
  nama_sppg_mitra: 'SPPG Sehat Barokah Surakarta',
  dibuat_pada: '2026-01-01T00:00:00.000Z',
  diperbarui_pada: '2026-01-01T00:00:00.000Z',
};

export const SEED_SCHOOLS: School[] = [
  SEED_SCHOOL,
  {
    id: '11111111-1111-1111-1111-111111111112',
    npsn: '20327971',
    nama_sekolah: 'SMAN 1 Surakarta',
    nama_kepala_sekolah: 'Drs. Harminingsih, M.Pd',
    nip_kepala_sekolah: '196804151993032008',
    nama_sppg_mitra: 'SPPG Nusantara Mandiri',
    dibuat_pada: '2026-01-02T00:00:00.000Z',
    diperbarui_pada: '2026-01-02T00:00:00.000Z',
  },
  {
    id: '11111111-1111-1111-1111-111111111113',
    npsn: '20327986',
    nama_sekolah: 'SMKN 2 Surakarta',
    nama_kepala_sekolah: 'Sugiyarso, S.Pd, M.Pd',
    nip_kepala_sekolah: '197011201995121003',
    nama_sppg_mitra: 'SPPG Gizi Prima Solo',
    dibuat_pada: '2026-01-03T00:00:00.000Z',
    diperbarui_pada: '2026-01-03T00:00:00.000Z',
  },
  {
    id: '11111111-1111-1111-1111-111111111114',
    npsn: '20327974',
    nama_sekolah: 'SMAN 4 Surakarta',
    nama_kepala_sekolah: 'Drs. Yusmar Setyobudi, M.M',
    nip_kepala_sekolah: '196909101994031005',
    nama_sppg_mitra: 'SPPG Berkah Mulia',
    dibuat_pada: '2026-01-04T00:00:00.000Z',
    diperbarui_pada: '2026-01-04T00:00:00.000Z',
  },
];

export const SEED_CLASSES: Kelas[] = [
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
  {
    id: '55555555-5555-5555-5555-555555555551',
    id_sekolah: '11111111-1111-1111-1111-111111111112',
    nama_kelas: 'XII IPA 1',
    tingkat: 'XII',
    jurusan: 'IPA',
    total_siswa_dapodik: 32,
    status_aktif: true,
    dibuat_pada: '',
    diperbarui_pada: '',
  },
  {
    id: '55555555-5555-5555-5555-555555555552',
    id_sekolah: '11111111-1111-1111-1111-111111111112',
    nama_kelas: 'XII IPS 1',
    tingkat: 'XII',
    jurusan: 'IPS',
    total_siswa_dapodik: 30,
    status_aktif: true,
    dibuat_pada: '',
    diperbarui_pada: '',
  },
  {
    id: '66666666-6666-6666-6666-666666666661',
    id_sekolah: '11111111-1111-1111-1111-111111111113',
    nama_kelas: 'XII TKJ A',
    tingkat: 'XII',
    jurusan: 'TKJ',
    total_siswa_dapodik: 34,
    status_aktif: true,
    dibuat_pada: '',
    diperbarui_pada: '',
  },
  {
    id: '77777777-7777-7777-7777-777777777771',
    id_sekolah: '11111111-1111-1111-1111-111111111114',
    nama_kelas: 'XII IPA A',
    tingkat: 'XII',
    jurusan: 'IPA',
    total_siswa_dapodik: 30,
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
    alergi_makanan: 'Alergi Kacang & Seafood',
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
    alergi_makanan: 'Alergi Telur',
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
    alergi_makanan: 'Alergi Susu Sapi (Laktosa)',
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
    alergi_makanan: 'Alergi Udang',
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
  {
    nisn: '2000000001',
    nama_lengkap: 'Rizky Aditya Saputra',
    id_kelas: '55555555-5555-5555-5555-555555555551',
    nama_kelas: 'XII IPA 1',
    jurusan: 'IPA',
    alergi_makanan: null,
    is_perwakilan_kelas: true,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '2000000002',
    nama_lengkap: 'Nabila Putri Kusuma',
    id_kelas: '55555555-5555-5555-5555-555555555552',
    nama_kelas: 'XII IPS 1',
    jurusan: 'IPS',
    alergi_makanan: 'Alergi Ikan Laut',
    is_perwakilan_kelas: true,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '3000000001',
    nama_lengkap: 'Fajar Nugroho',
    id_kelas: '66666666-6666-6666-6666-666666666661',
    nama_kelas: 'XII TKJ A',
    jurusan: 'TKJ',
    alergi_makanan: 'Alergi Udang',
    is_perwakilan_kelas: true,
    sudah_ambil: false,
    waktu_ambil: null,
  },
  {
    nisn: '4000000001',
    nama_lengkap: 'Ayu Sekar Arum',
    id_kelas: '77777777-7777-7777-7777-777777777771',
    nama_kelas: 'XII IPA A',
    jurusan: 'IPA',
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

// ============================================================
// TAHAP 1 & 5 RBAC AUTH: DUAL-MODE STUDENT LOGIN & PHONE NORMALIZER
// ============================================================

export function normalizePhone628(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('08')) {
    return '628' + digits.slice(2);
  }
  if (digits.startsWith('8')) {
    return '628' + digits.slice(1);
  }
  if (digits.startsWith('6208')) {
    return '628' + digits.slice(4);
  }
  return digits;
}

export function isValidPhone628(phone: string): boolean {
  const clean = (phone || '').trim();
  return /^628\d{7,13}$/.test(clean);
}

export const SEED_STUDENT_PHONES: Record<string, string> = {
  '1000000001': '6281234567890', // Alroy Theola Ardanta (XII RPL 1 - Perwakilan Kelas)
  '1000000002': '6281234567891', // Annisa Rahmawati (XII RPL 1)
  '1000000003': '6281234567892', // Bagas Pratama (XII RPL 1)
  '1000000004': '6281234567893', // Cantika Dewi (XII RPL 1)
  '1000000005': '6281234567894', // Dimas Aditya (XII RPL 1)
  '1000000006': '6281234567895', // Eka Putri Lestari (XII RPL 1)
  '1000000026': '6281234567896', // Joko Prabowo (XII RPL 2 - Perwakilan Kelas)
  '1000000027': '6281234567897', // Kurnia Ramadhan (XII RPL 2)
  '1000000051': '6281234567898', // Olivia Zahra (XII TKJ 1 - Perwakilan Kelas)
  '2000000001': '6281399001101', // Rizky Aditya Saputra (SMAN 1 Surakarta)
  '2000000002': '6281399001102', // Nabila Putri Kusuma (SMAN 1 Surakarta)
  '3000000001': '6281399002201', // Fajar Nugroho (SMKN 2 Surakarta)
  '4000000001': '6281399003301', // Ayu Sekar Arum (SMAN 4 Surakarta)
};

export async function authenticateStudentByNameAndPhone(
  nama: string,
  noHp: string
): Promise<{ student?: StudentAuthProfile; error?: string }> {
  const cleanName = (nama || '').trim();
  const normalizedPhone = normalizePhone628(noHp);

  if (!cleanName || cleanName.length < 2) {
    return { error: 'Harap masukkan Nama Lengkap siswa yang valid.' };
  }

  if (!isValidPhone628(normalizedPhone)) {
    return {
      error: 'Format Nomor HP wajib diawali 628xxx (contoh: 6281234567890, minimal 10 digit).',
    };
  }

  const altPhone08 = '0' + normalizedPhone.slice(2);

  // 1. Cek ke tabel `students` (Skema v1.2) di Supabase
  try {
    const { data: dbStudents } = await supabase
      .from('students')
      .select('*, classes:id_kelas(id, nama_kelas, jurusan)')
      .ilike('nama_lengkap', cleanName)
      .in('no_hp', [normalizedPhone, altPhone08])
      .limit(1);

    if (dbStudents && dbStudents.length > 0) {
      const s = dbStudents[0] as any;
      const cls = Array.isArray(s.classes) ? s.classes[0] : s.classes;
      const fallbackCls = SEED_CLASSES.find((c) => c.id === s.id_kelas);
      return {
        student: {
          nisn: s.nisn,
          nama_lengkap: s.nama_lengkap,
          no_hp: normalizedPhone,
          id_kelas: s.id_kelas,
          nama_kelas: cls?.nama_kelas || fallbackCls?.nama_kelas || 'XII RPL 1',
          jurusan: cls?.jurusan || s.jurusan || fallbackCls?.jurusan || 'RPL',
          is_perwakilan_kelas: !!s.is_perwakilan_kelas,
        },
      };
    }
  } catch {
    // Lanjut ke tabel siswa legacy / localStorage
  }

  // 2. Cek ke tabel `siswa` (jika memakai skema siswa)
  try {
    const { data: legacyStudents } = await supabase
      .from('siswa')
      .select('*, kelas:kelas_id(id, nama_kelas, jurusan)')
      .ilike('nama', cleanName)
      .in('no_hp', [normalizedPhone, altPhone08])
      .limit(1);

    if (legacyStudents && legacyStudents.length > 0) {
      const s = legacyStudents[0] as any;
      const cls = Array.isArray(s.kelas) ? s.kelas[0] : s.kelas;
      return {
        student: {
          nisn: s.nisn || s.id,
          nama_lengkap: s.nama,
          no_hp: normalizedPhone,
          id_kelas: s.kelas_id || SEED_CLASSES[0].id,
          nama_kelas: cls?.nama_kelas || 'XII RPL 1',
          jurusan: cls?.jurusan || 'RPL',
          is_perwakilan_kelas: false,
        },
      };
    }
  } catch {
    // Lanjut ke localStorage & SEED_STUDENTS
  }

  // 3. Cek dari data siswa hasil Import / LocalStorage (`mbg_imported_students`)
  const importedStudents = getLocalItem<StudentAuthProfile[]>('mbg_imported_students', []);
  const foundImported = importedStudents.find(
    (s) =>
      s.nama_lengkap.trim().toLowerCase() === cleanName.toLowerCase() &&
      normalizePhone628(s.no_hp) === normalizedPhone
  );
  if (foundImported) {
    return { student: { ...foundImported, no_hp: normalizedPhone } };
  }

  // 4. Cek dari SEED_STUDENTS (wajib cocok Nama Lengkap dan Nomor HP resmi terdaftar)
  const foundSeed = SEED_STUDENTS.find(
    (s) => s.nama_lengkap.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (foundSeed) {
    const expectedPhone = SEED_STUDENT_PHONES[foundSeed.nisn];
    if (expectedPhone && expectedPhone === normalizedPhone) {
      return {
        student: {
          nisn: foundSeed.nisn,
          nama_lengkap: foundSeed.nama_lengkap,
          no_hp: normalizedPhone,
          id_kelas: foundSeed.id_kelas,
          nama_kelas: foundSeed.nama_kelas,
          jurusan: foundSeed.jurusan,
          is_perwakilan_kelas: foundSeed.is_perwakilan_kelas,
        },
      };
    }
  }

  return {
    error:
      'Data siswa dengan kombinasi Nama dan Nomor HP tersebut tidak ditemukan. Pastikan Nomor HP telah terdaftar di Data Siswa.',
  };
}

// ============================================================
// TAHAP 3: MASTER MENU & CAMPAIGN MANAGER (SUPER ADMIN MARCOMM UBSI)
// ============================================================

export const SEED_CAMPAIGNS: CrmCampaign[] = [
  {
    id: 'camp-ubsi-rpl-01',
    judul_promo: 'Beasiswa Talenta Digital UBSI 100% (Khusus Jurusan IT/RPL/TKJ)',
    banner_image_url:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    target_tingkat: 'XII',
    target_jurusan: ['RPL', 'TKJ', 'IPA'],
    rekomendasi_fakultas_ubsi: 'Fakultas Teknik & Informatika (FTI) - S1 Rekayasa Perangkat Lunak',
    cta_url_template:
      'https://wa.me/6281299998888?text=Halo%20Tim%20PMB%20UBSI,%20saya%20siswa%20MBG%20tertarik%20info%20Beasiswa%20Talenta%20Digital%20FTI%20UBSI',
    poin_interaksi: 2,
    status_aktif: true,
  },
  {
    id: 'camp-ubsi-feb-02',
    judul_promo: 'Beasiswa Prestasi Akademik & Non-Akademik Universitas BSI',
    banner_image_url:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80',
    target_tingkat: 'XII',
    target_jurusan: ['AKUNTANSI', 'IPS', 'UMUM', 'RPL', 'TKJ'],
    rekomendasi_fakultas_ubsi: 'Fakultas Ekonomi & Bisnis (FEB) / Ilmu Komunikasi (FIK)',
    cta_url_template:
      'https://wa.me/6281299998888?text=Halo%20Tim%20Marcomm%20UBSI,%20saya%20ingin%20konsultasi%20pendaftaran%20kuliah%20dan%20beasiswa%20UBSI',
    poin_interaksi: 1,
    status_aktif: true,
  },
];

export async function getAllCrmCampaigns(): Promise<CrmCampaign[]> {
  const localCampaigns = getLocalItem<CrmCampaign[]>('mbg_crm_campaigns', []);
  const statusMap = getLocalItem<Record<string, boolean>>('mbg_crm_campaign_status', {});

  try {
    const { data, error } = await supabase.from('crm_campaigns').select('*');
    if (!error && data && data.length > 0) {
      const merged: CrmCampaign[] = data.map((row: any) => ({
        id: row.id,
        judul_promo: row.judul_promo,
        banner_image_url: row.banner_image_url || null,
        target_tingkat: row.target_tingkat || 'XII',
        target_jurusan: Array.isArray(row.target_jurusan) ? row.target_jurusan : ['UMUM'],
        rekomendasi_fakultas_ubsi: row.rekomendasi_fakultas_ubsi || 'Fakultas Teknik & Informatika',
        cta_url_template: row.cta_url_template || 'https://bsi.ac.id',
        poin_interaksi: row.poin_interaksi ?? 1,
        status_aktif:
          typeof row.status_aktif === 'boolean'
            ? row.status_aktif
            : statusMap[row.id] !== undefined
            ? statusMap[row.id]
            : true,
      }));
      setLocalItem('mbg_crm_campaigns', merged);
      return merged;
    }
  } catch {
    // Fallback ke localStorage
  }

  if (localCampaigns.length > 0) {
    return localCampaigns.map((c) => ({
      ...c,
      status_aktif: statusMap[c.id] !== undefined ? statusMap[c.id] : c.status_aktif ?? true,
    }));
  }

  setLocalItem('mbg_crm_campaigns', SEED_CAMPAIGNS);
  return SEED_CAMPAIGNS;
}

export async function getActiveCrmCampaigns(jurusan?: string): Promise<CrmCampaign[]> {
  const all = await getAllCrmCampaigns();
  const active = all.filter((c) => c.status_aktif !== false);
  if (!jurusan) return active;

  const matched = active.filter(
    (c) =>
      !c.target_jurusan ||
      c.target_jurusan.length === 0 ||
      c.target_jurusan.some(
        (j) =>
          j.toUpperCase() === jurusan.toUpperCase() ||
          jurusan.toUpperCase().includes(j.toUpperCase()) ||
          j.toUpperCase() === 'UMUM'
      )
  );
  return matched.length > 0 ? matched : active;
}

export async function saveCrmCampaign(
  campaign: Partial<CrmCampaign> & { judul_promo: string },
  penggunaId?: string
): Promise<CrmCampaign> {
  const all = await getAllCrmCampaigns();
  const isEdit = !!campaign.id && all.some((c) => c.id === campaign.id);
  const id =
    campaign.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `camp-${Date.now()}`);

  const newRecord: CrmCampaign = {
    id,
    judul_promo: campaign.judul_promo.trim(),
    banner_image_url: campaign.banner_image_url?.trim() || null,
    target_tingkat: campaign.target_tingkat || 'XII',
    target_jurusan:
      campaign.target_jurusan && campaign.target_jurusan.length > 0
        ? campaign.target_jurusan
        : ['RPL', 'TKJ', 'UMUM'],
    rekomendasi_fakultas_ubsi:
      campaign.rekomendasi_fakultas_ubsi?.trim() || 'Fakultas Teknik & Informatika (FTI)',
    cta_url_template:
      campaign.cta_url_template?.trim() ||
      'https://wa.me/6281299998888?text=Halo%20PMB%20UBSI,%20saya%20ingin%20info%20beasiswa',
    poin_interaksi: Number(campaign.poin_interaksi) || 1,
    status_aktif: campaign.status_aktif ?? true,
  };

  // Simpan status_aktif di map lokal
  const statusMap = getLocalItem<Record<string, boolean>>('mbg_crm_campaign_status', {});
  statusMap[id] = newRecord.status_aktif ?? true;
  setLocalItem('mbg_crm_campaign_status', statusMap);

  try {
    const dbPayload: any = {
      id,
      judul_promo: newRecord.judul_promo,
      banner_image_url: newRecord.banner_image_url,
      target_tingkat: newRecord.target_tingkat,
      target_jurusan: newRecord.target_jurusan,
      rekomendasi_fakultas_ubsi: newRecord.rekomendasi_fakultas_ubsi,
      cta_url_template: newRecord.cta_url_template,
      poin_interaksi: newRecord.poin_interaksi,
    };
    const { data, error } = await supabase
      .from('crm_campaigns')
      .upsert(dbPayload)
      .select()
      .maybeSingle();
    if (!error && data) {
      newRecord.id = data.id;
    }
  } catch {
    // Tetap simpan ke localStorage
  }

  const updatedList = isEdit
    ? all.map((c) => (c.id === id ? newRecord : c))
    : [newRecord, ...all];
  setLocalItem('mbg_crm_campaigns', updatedList);

  await logActivity(
    isEdit ? 'UPDATE_CRM_CAMPAIGN' : 'CREATE_CRM_CAMPAIGN',
    'crm_campaigns',
    newRecord.id,
    null,
    newRecord,
    penggunaId || null
  );

  return newRecord;
}

export async function toggleCrmCampaignStatus(
  id: string,
  statusAktif: boolean,
  penggunaId?: string
): Promise<CrmCampaign[]> {
  const all = await getAllCrmCampaigns();
  const statusMap = getLocalItem<Record<string, boolean>>('mbg_crm_campaign_status', {});
  statusMap[id] = statusAktif;
  setLocalItem('mbg_crm_campaign_status', statusMap);

  const updated = all.map((c) => (c.id === id ? { ...c, status_aktif: statusAktif } : c));
  setLocalItem('mbg_crm_campaigns', updated);

  try {
    await supabase.from('crm_campaigns').update({ status_aktif: statusAktif } as any).eq('id', id);
  } catch {
    // Abaikan jika kolom status_aktif belum dimigrasi di DB, karena statusMap lokal tetap menjaga state
  }

  await logActivity(
    statusAktif ? 'ACTIVATE_CRM_CAMPAIGN' : 'DEACTIVATE_CRM_CAMPAIGN',
    'crm_campaigns',
    id,
    { status_aktif: !statusAktif },
    { status_aktif: statusAktif },
    penggunaId || null
  );

  return updated;
}

export async function deleteCrmCampaign(id: string, penggunaId?: string): Promise<CrmCampaign[]> {
  const all = await getAllCrmCampaigns();
  const target = all.find((c) => c.id === id);
  const updated = all.filter((c) => c.id !== id);
  setLocalItem('mbg_crm_campaigns', updated);

  try {
    await supabase.from('crm_campaigns').delete().eq('id', id);
  } catch {
    // Abaikan jika offline
  }

  await logActivity(
    'DELETE_CRM_CAMPAIGN',
    'crm_campaigns',
    id,
    target || null,
    null,
    penggunaId || null
  );

  return updated;
}

export async function syncMasterDataDapodik(penggunaId?: string): Promise<{
  success: boolean;
  totalKelas: number;
  totalSiswa: number;
  timestamp: string;
}> {
  const nowIso = new Date().toISOString();

  // Sinkronkan akun siswa dari SEED_STUDENTS beserta nomor HP 628xxx ke localStorage & Supabase
  const existingImported = getLocalItem<StudentAuthProfile[]>('mbg_imported_students', []);
  const mapByKey = new Map<string, StudentAuthProfile>();

  for (const item of existingImported) {
    const key = `${item.nama_lengkap.toLowerCase()}|${normalizePhone628(item.no_hp)}`;
    mapByKey.set(key, item);
  }

  for (const seed of SEED_STUDENTS) {
    const phone = SEED_STUDENT_PHONES[seed.nisn] || `62812000${seed.nisn.slice(-5)}`;
    const profile: StudentAuthProfile = {
      nisn: seed.nisn,
      nama_lengkap: seed.nama_lengkap,
      no_hp: phone,
      id_kelas: seed.id_kelas,
      nama_kelas: seed.nama_kelas,
      jurusan: seed.jurusan,
      is_perwakilan_kelas: seed.is_perwakilan_kelas,
    };
    const key = `${profile.nama_lengkap.toLowerCase()}|${profile.no_hp}`;
    mapByKey.set(key, profile);
  }

  const syncedStudents = Array.from(mapByKey.values());
  setLocalItem('mbg_imported_students', syncedStudents);

  // Upsert ke tabel `students` di Supabase bila terkoneksi
  try {
    const toUpsert = syncedStudents.map((s) => ({
      nisn: s.nisn,
      id_kelas: s.id_kelas,
      nama_lengkap: s.nama_lengkap,
      no_hp: s.no_hp,
      jurusan: s.jurusan,
      is_perwakilan_kelas: s.is_perwakilan_kelas,
    }));
    await supabase.from('students').upsert(toUpsert, { onConflict: 'nisn' });
  } catch {
    // Offline fallback
  }

  await logActivity(
    'SYNC_MASTER_DATA_DAPODIK',
    'students',
    null,
    null,
    {
      school: SEED_SCHOOL.nama_sekolah,
      npsn: SEED_SCHOOL.npsn,
      synced_classes: SEED_CLASSES.length,
      synced_students: syncedStudents.length,
    },
    penggunaId || null
  );

  return {
    success: true,
    totalKelas: SEED_CLASSES.length,
    totalSiswa: syncedStudents.reduce((acc) => acc + 1, 0),
    timestamp: nowIso,
  };
}

// ============================================================
// TAHAP 4: CORRECTION MODE (KEPALA SEKOLAH / SUPER ADMIN)
// ============================================================

export async function correctClassAttendance(params: {
  idKelas: string;
  namaKelas: string;
  totalSiswa: number;
  jumlahHadirBaru: number;
  jumlahAbsenBaru: number;
  alasanKoreksi: string;
  penggunaId?: string | null;
  namaPengguna?: string | null;
}): Promise<{ success: boolean; message: string }> {
  const today = getJakartaDateString();
  const hadir = Math.max(0, Math.min(params.totalSiswa, Number(params.jumlahHadirBaru) || 0));
  const absen = Math.max(0, Number(params.jumlahAbsenBaru) ?? params.totalSiswa - hadir);
  const nowIso = new Date().toISOString();

  const localAtt = getLocalItem<any[]>(`mbg_attendances_${today}`, []);
  const existingIdx = localAtt.findIndex((a) => a.id_kelas === params.idKelas);
  const prevData =
    existingIdx >= 0
      ? {
          jumlah_hadir: localAtt[existingIdx].jumlah_hadir,
          jumlah_absen: localAtt[existingIdx].jumlah_absen,
          status_ambil: localAtt[existingIdx].status_ambil,
        }
      : { jumlah_hadir: 0, jumlah_absen: params.totalSiswa, status_ambil: 'MENUNGGU' };

  const newStatus: AttendanceStatus = hadir > 0 ? 'SUDAH_TERIMA_MBG' : 'MENUNGGU';
  const targetClass = SEED_CLASSES.find((c) => c.id === params.idKelas);

  if (existingIdx >= 0) {
    localAtt[existingIdx] = {
      ...localAtt[existingIdx],
      jumlah_hadir: hadir,
      jumlah_absen: absen,
      status_ambil: newStatus,
      waktu_terima_kelas: localAtt[existingIdx].waktu_terima_kelas || nowIso,
    };
  } else {
    localAtt.push({
      id: `da-${params.idKelas}-${Date.now()}`,
      id_kelas: params.idKelas,
      id_uji: 'corrected-session',
      tanggal: today,
      jumlah_hadir: hadir,
      jumlah_absen: absen,
      status_ambil: newStatus,
      waktu_terima_kelas: nowIso,
      classes: targetClass,
    });
  }
  setLocalItem(`mbg_attendances_${today}`, localAtt);

  // Update di Supabase `daily_attendances` jika ada baris hari ini
  let attendanceId: string | null = null;
  try {
    const { data: existingRow } = await supabase
      .from('daily_attendances')
      .select('id, jumlah_hadir, jumlah_absen')
      .eq('id_kelas', params.idKelas)
      .eq('tanggal', today)
      .maybeSingle();

    if (existingRow?.id) {
      attendanceId = existingRow.id;
      await supabase
        .from('daily_attendances')
        .update({
          jumlah_hadir: hadir,
          jumlah_absen: absen,
          status_ambil: newStatus,
          waktu_terima_kelas: nowIso,
        })
        .eq('id', existingRow.id);
    }
  } catch {
    // Offline fallback
  }

  // Catat ke Audit Log dengan label wajib "CORRECTION_BY_KEPSEK"
  await logActivity(
    'CORRECTION_BY_KEPSEK',
    'daily_attendances',
    attendanceId,
    {
      kelas: params.namaKelas,
      ...prevData,
    },
    {
      kelas: params.namaKelas,
      jumlah_hadir: hadir,
      jumlah_absen: absen,
      status_ambil: newStatus,
      alasan_koreksi: params.alasanKoreksi.trim() || 'Koreksi rekapitulasi pasca-operasional',
      dikoreksi_oleh: params.namaPengguna || 'Kepala Sekolah',
    },
    params.penggunaId || null
  );

  // Tambahkan ke live activity feed
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const localLogs = getLocalItem<any[]>(`mbg_logs_${today}`, []);
  localLogs.unshift({
    id: `log-corr-${Date.now()}`,
    nama_kelas: params.namaKelas,
    deskripsi: `[KOREKSI KEPSEK] Data ${params.namaKelas} diperbarui menjadi ${hadir} Hadir / ${absen} Absen (${timeStr} WIB)`,
    waktu: timeStr,
    waktu_ambil: nowIso,
    tipe_klaim: 'KOLEKTIF_KELAS',
    jumlah_porsi: hadir,
  });
  setLocalItem(`mbg_logs_${today}`, localLogs.slice(0, 30));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mbg-live-activity'));
  }

  return {
    success: true,
    message: `Data kelas ${params.namaKelas} berhasil dikoreksi (${hadir} Hadir, ${absen} Absen) & tercatat di Audit Log (CORRECTION_BY_KEPSEK).`,
  };
}

// ============================================================
// TAHAP 5: AUTO-ACCOUNT GENERATION (STUDENT IMPORT & CRUD ENGINE)
// ============================================================

export interface ExtendedStudentProfile extends StudentAuthProfile {
  email?: string | null;
  alergi_makanan?: string | null;
  lead_score?: number;
  lead_status?: 'COLD' | 'WARM' | 'HOT';
  status_aktif?: boolean;
  id_sekolah?: string;
}

export async function importStudentsWithAutoAccount(params: {
  rows: Array<{
    nama: string;
    nisn?: string | null;
    kelas_id: string;
    nama_kelas?: string;
    jurusan?: string;
    email?: string | null;
    no_hp?: string | null;
    alergi_makanan?: string | null;
    is_perwakilan_kelas?: boolean;
    status_aktif?: boolean;
  }>;
  penggunaId?: string | null;
  schoolId?: string | null;
  allowUpdate?: boolean;
}): Promise<{
  insertedCount: number;
  skippedDuplicateCount: number;
  autoAccountsCreated: number;
  message: string;
}> {
  const targetSchoolId = getActiveSchoolIdFromStorage(params.schoolId || undefined);
  const existingLocal = getLocalItem<ExtendedStudentProfile[]>('mbg_imported_students', []);
  const dedupSet = new Set<string>();
  const nisnSet = new Set<string>();

  if (!params.allowUpdate) {
    for (const s of existingLocal) {
      dedupSet.add(`${s.nama_lengkap.trim().toLowerCase()}|${normalizePhone628(s.no_hp)}`);
      if (s.nisn) nisnSet.add(s.nisn);
    }
    for (const seed of SEED_STUDENTS) {
      const seedPhone = SEED_STUDENT_PHONES[seed.nisn] || '';
      if (seedPhone) {
        dedupSet.add(`${seed.nama_lengkap.trim().toLowerCase()}|${seedPhone}`);
      }
      nisnSet.add(seed.nisn);
    }
  }

  const validLegacyInsert: any[] = [];
  const validV12Upsert: any[] = [];
  const newProfiles: ExtendedStudentProfile[] = [];
  let skippedDuplicateCount = 0;
  let autoAccountsCreated = 0;

  const allClasses = await getClassesBySchool(targetSchoolId);

  for (const row of params.rows) {
    const cleanNama = (row.nama || '').trim();
    if (!cleanNama) {
      skippedDuplicateCount++;
      continue;
    }

    const rawPhone = (row.no_hp || '').trim();
    const normalizedPhone = rawPhone
      ? normalizePhone628(rawPhone)
      : `62813${String(Math.floor(1000000 + Math.random() * 9000000))}`;

    const cleanNisn =
      row.nisn && String(row.nisn).trim().length >= 5
        ? String(row.nisn).replace(/\D/g, '').slice(0, 10).padStart(10, '0')
        : String(Math.floor(1000000000 + Math.random() * 9000000000));

    const dedupKey = `${cleanNama.toLowerCase()}|${normalizedPhone}`;
    if (!params.allowUpdate && (dedupSet.has(dedupKey) || (row.nisn && nisnSet.has(cleanNisn)))) {
      skippedDuplicateCount++;
      continue;
    }
    dedupSet.add(dedupKey);
    nisnSet.add(cleanNisn);

    const targetCls =
      allClasses.find((c) => c.id === row.kelas_id) ||
      SEED_CLASSES.find((c) => c.id === row.kelas_id);
    const namaKelas = row.nama_kelas || targetCls?.nama_kelas || 'XII RPL 1';
    const jurusan = row.jurusan || targetCls?.jurusan || 'RPL';
    const alergi = row.alergi_makanan ? row.alergi_makanan.trim() : null;
    const isPerwakilan = !!row.is_perwakilan_kelas;
    const isAktif = row.status_aktif ?? true;

    validLegacyInsert.push({
      nama: cleanNama,
      nisn: cleanNisn,
      kelas_id: row.kelas_id,
      email: row.email ? row.email.trim() : null,
      no_hp: normalizedPhone,
      status_aktif: isAktif,
    });

    validV12Upsert.push({
      nisn: cleanNisn,
      id_kelas: row.kelas_id,
      nama_lengkap: cleanNama,
      no_hp: normalizedPhone,
      email: row.email ? row.email.trim() : null,
      jurusan,
      alergi_makanan: alergi,
      is_perwakilan_kelas: isPerwakilan,
      status_aktif: isAktif,
    });

    newProfiles.push({
      nisn: cleanNisn,
      nama_lengkap: cleanNama,
      no_hp: normalizedPhone,
      id_kelas: row.kelas_id,
      nama_kelas: namaKelas,
      jurusan,
      is_perwakilan_kelas: isPerwakilan,
      email: row.email ? row.email.trim() : null,
      alergi_makanan: alergi,
      status_aktif: isAktif,
      id_sekolah: targetSchoolId,
    });

    if (isValidPhone628(normalizedPhone)) {
      autoAccountsCreated++;
    }
  }

  if (newProfiles.length > 0) {
    const newNisns = new Set(newProfiles.map((p) => p.nisn));
    const filteredExisting = existingLocal.filter((e) => !newNisns.has(e.nisn));
    setLocalItem('mbg_imported_students', [...newProfiles, ...filteredExisting]);

    // Update local class rosters so Student Portal immediately sees added/edited students
    for (const prof of newProfiles) {
      const rosterKey = `mbg_roster_${prof.id_kelas}`;
      const existingRoster = getLocalItem<StudentRecord[]>(rosterKey, []);
      const baseRoster =
        existingRoster.length > 0
          ? existingRoster
          : SEED_STUDENTS.filter((s) => s.id_kelas === prof.id_kelas);
      const foundIdx = baseRoster.findIndex((r) => r.nisn === prof.nisn);
      const record: StudentRecord = {
        nisn: prof.nisn,
        nama_lengkap: prof.nama_lengkap,
        id_kelas: prof.id_kelas,
        nama_kelas: prof.nama_kelas,
        jurusan: prof.jurusan,
        alergi_makanan: prof.alergi_makanan || null,
        is_perwakilan_kelas: prof.is_perwakilan_kelas,
        sudah_ambil: foundIdx >= 0 ? baseRoster[foundIdx].sudah_ambil : false,
        waktu_ambil: foundIdx >= 0 ? baseRoster[foundIdx].waktu_ambil : null,
      };
      if (foundIdx >= 0) {
        baseRoster[foundIdx] = record;
        setLocalItem(rosterKey, baseRoster);
      } else {
        setLocalItem(rosterKey, [...baseRoster, record]);
      }
    }

    // Simpan ke tabel `students` (Skema v1.2 - Basis Login Siswa)
    try {
      await supabase.from('students').upsert(validV12Upsert, { onConflict: 'nisn' });
    } catch {
      // Abaikan jika tabel tidak tersedia/offline
    }

    // Simpan juga ke tabel `siswa` (jika dipakai oleh UI manajemen siswa)
    try {
      await supabase.from('siswa').insert(validLegacyInsert);
    } catch {
      // Abaikan jika offline
    }

    await logActivity(
      params.allowUpdate ? 'UPDATE_DATA_SISWA' : 'AUTO_ACCOUNT_IMPORT_SISWA',
      'students',
      null,
      null,
      {
        school_id: targetSchoolId,
        inserted: newProfiles.length,
        skipped_duplicates: skippedDuplicateCount,
        auto_accounts_628: autoAccountsCreated,
      },
      params.penggunaId || null
    );
  }

  return {
    insertedCount: newProfiles.length,
    skippedDuplicateCount,
    autoAccountsCreated,
    message: `Berhasil memproses ${newProfiles.length} siswa (${autoAccountsCreated} akun login otomatis dengan No. HP 628xxx aktif, ${skippedDuplicateCount} duplikat dilewati).`,
  };
}

// ============================================================
// TAHAP 1 & 3 SAAS MULTI-TENANT: MANAJEMEN SEKOLAH & GLOBAL STATS
// ============================================================

export async function getAllSchools(): Promise<School[]> {
  const localSchools = getLocalItem<School[]>('mbg_schools_store', []);

  try {
    const { data, error } = await supabase
      .from('schools')
      .select('*')
      .order('nama_sekolah');
    if (!error && data && data.length > 0) {
      const mergedMap = new Map<string, School>();
      for (const s of SEED_SCHOOLS) mergedMap.set(s.id, s);
      for (const s of localSchools) mergedMap.set(s.id, s);
      for (const s of data as School[]) mergedMap.set(s.id, s);
      const list = Array.from(mergedMap.values());
      setLocalItem('mbg_schools_store', list);
      return list;
    }
  } catch {
    // Fallback to local store
  }

  if (localSchools.length > 0) {
    return localSchools;
  }

  setLocalItem('mbg_schools_store', SEED_SCHOOLS);
  return SEED_SCHOOLS;
}

export async function getSchoolById(schoolId?: string): Promise<School> {
  const targetId = getActiveSchoolIdFromStorage(schoolId);
  const all = await getAllSchools();
  return all.find((s) => s.id === targetId) || SEED_SCHOOL;
}

export async function saveSchool(
  school: Partial<School> & { npsn: string; nama_sekolah: string },
  penggunaId?: string | null
): Promise<School> {
  const all = await getAllSchools();
  const isEdit = !!school.id && all.some((s) => s.id === school.id);
  const nowIso = new Date().toISOString();

  // Check duplicate NPSN
  const duplicateNpsn = all.find(
    (s) => s.npsn.trim() === school.npsn.trim() && s.id !== school.id
  );
  if (duplicateNpsn) {
    throw new Error(
      `NPSN ${school.npsn} sudah terdaftar untuk sekolah "${duplicateNpsn.nama_sekolah}".`
    );
  }

  const id =
    school.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `11111111-1111-4111-8111-${Date.now().toString().slice(-12)}`);

  const newRecord: School = {
    id,
    npsn: school.npsn.trim(),
    nama_sekolah: school.nama_sekolah.trim(),
    nama_kepala_sekolah: school.nama_kepala_sekolah?.trim() || null,
    nip_kepala_sekolah: school.nip_kepala_sekolah?.trim() || null,
    nama_sppg_mitra: school.nama_sppg_mitra?.trim() || 'SPPG Mitra Bergizi',
    dibuat_pada: school.dibuat_pada || nowIso,
    diperbarui_pada: nowIso,
  };

  try {
    const { data, error } = await supabase
      .from('schools')
      .upsert({
        id: newRecord.id,
        npsn: newRecord.npsn,
        nama_sekolah: newRecord.nama_sekolah,
        nama_kepala_sekolah: newRecord.nama_kepala_sekolah,
        nip_kepala_sekolah: newRecord.nip_kepala_sekolah,
        nama_sppg_mitra: newRecord.nama_sppg_mitra,
        diperbarui_pada: nowIso,
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      newRecord.id = data.id;
    }
  } catch {
    // Offline fallback
  }

  const updated = isEdit
    ? all.map((s) => (s.id === id ? newRecord : s))
    : [newRecord, ...all];
  setLocalItem('mbg_schools_store', updated);

  await logActivity(
    isEdit ? 'UPDATE_SEKOLAH_MITRA' : 'CREATE_SEKOLAH_MITRA',
    'schools',
    newRecord.id,
    null,
    newRecord,
    penggunaId || null
  );

  return newRecord;
}

export async function deleteSchool(
  id: string,
  penggunaId?: string | null
): Promise<School[]> {
  if (id === SEED_SCHOOL.id) {
    throw new Error('Sekolah pusat utama (UBSI Center) tidak dapat dihapus.');
  }
  const all = await getAllSchools();
  const target = all.find((s) => s.id === id);
  const updated = all.filter((s) => s.id !== id);
  setLocalItem('mbg_schools_store', updated);

  try {
    await supabase.from('schools').delete().eq('id', id);
  } catch {
    // Offline fallback
  }

  await logActivity(
    'DELETE_SEKOLAH_MITRA',
    'schools',
    id,
    target || null,
    null,
    penggunaId || null
  );

  return updated;
}

export async function getGlobalMultiSchoolStats(): Promise<{
  totalSekolahAktif: number;
  totalKelasLintasSekolah: number;
  totalSiswaLintasSekolah: number;
  totalPorsiTerserapGlobal: number;
  schoolsSummary: Array<{
    school: School;
    totalKelas: number;
    totalSiswa: number;
  }>;
}> {
  const schools = await getAllSchools();
  const localClasses = getLocalItem<Kelas[]>('mbg_classes_store', []);
  const allClassesMap = new Map<string, Kelas>();
  for (const c of SEED_CLASSES) allClassesMap.set(c.id, c);
  for (const c of localClasses) allClassesMap.set(c.id, c);

  try {
    const { data: dbClasses } = await supabase.from('classes').select('*');
    if (dbClasses) {
      for (const c of dbClasses as Kelas[]) allClassesMap.set(c.id, c);
    }
  } catch {
    // fallback
  }

  const allClasses = Array.from(allClassesMap.values()).filter(
    (c) => c.status_aktif !== false
  );

  const today = getJakartaDateString();
  const localAtt = getLocalItem<any[]>(`mbg_attendances_${today}`, []);
  const totalPorsiTerserapGlobal = localAtt.reduce(
    (acc, item) => acc + (Number(item.jumlah_hadir) || 0),
    0
  );

  const schoolsSummary = schools.map((school) => {
    const schoolCls = allClasses.filter((c) => c.id_sekolah === school.id);
    const totalSiswa = schoolCls.reduce(
      (sum, c) => sum + (Number(c.total_siswa_dapodik) || 30),
      0
    );
    return {
      school,
      totalKelas: schoolCls.length,
      totalSiswa,
    };
  });

  const totalSiswaLintasSekolah = schoolsSummary.reduce(
    (acc, s) => acc + s.totalSiswa,
    0
  );

  return {
    totalSekolahAktif: schools.length,
    totalKelasLintasSekolah: allClasses.length,
    totalSiswaLintasSekolah,
    totalPorsiTerserapGlobal,
    schoolsSummary,
  };
}

// ============================================================
// TAHAP 4: MASTER DATA CRUD KELAS (GURU PIKET & SUPER ADMIN)
// ============================================================

export async function getClassesBySchool(schoolId?: string): Promise<Kelas[]> {
  const targetSchoolId = getActiveSchoolIdFromStorage(schoolId);
  const localClasses = getLocalItem<Kelas[]>('mbg_classes_store', []);

  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id_sekolah', targetSchoolId)
      .order('tingkat')
      .order('nama_kelas');

    if (!error && data && data.length > 0) {
      const mergedMap = new Map<string, Kelas>();
      for (const sc of SEED_CLASSES.filter((c) => c.id_sekolah === targetSchoolId)) {
        mergedMap.set(sc.id, sc);
      }
      for (const lc of localClasses.filter((c) => c.id_sekolah === targetSchoolId)) {
        mergedMap.set(lc.id, lc);
      }
      for (const dbc of data as Kelas[]) {
        mergedMap.set(dbc.id, {
          ...dbc,
          status_aktif: dbc.status_aktif ?? true,
        });
      }
      return Array.from(mergedMap.values());
    }
  } catch {
    // Fallback to local
  }

  const combinedMap = new Map<string, Kelas>();
  for (const sc of SEED_CLASSES.filter((c) => c.id_sekolah === targetSchoolId)) {
    combinedMap.set(sc.id, sc);
  }
  for (const lc of localClasses.filter((c) => c.id_sekolah === targetSchoolId)) {
    combinedMap.set(lc.id, lc);
  }

  return Array.from(combinedMap.values());
}

export async function saveClassRecord(
  kelas: Partial<Kelas> & {
    nama_kelas: string;
    tingkat: string;
    jurusan: string;
  },
  schoolId?: string,
  penggunaId?: string | null
): Promise<Kelas> {
  const targetSchoolId = getActiveSchoolIdFromStorage(kelas.id_sekolah || schoolId);
  const localClasses = getLocalItem<Kelas[]>('mbg_classes_store', []);
  const allKnown = [...SEED_CLASSES, ...localClasses];
  const isEdit = !!kelas.id && allKnown.some((c) => c.id === kelas.id);
  const nowIso = new Date().toISOString();

  const id =
    kelas.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `22222222-2222-4222-8222-${Date.now().toString().slice(-12)}`);

  const newRecord: Kelas = {
    id,
    id_sekolah: targetSchoolId,
    nama_kelas: kelas.nama_kelas.trim(),
    tingkat: kelas.tingkat.trim(),
    jurusan: kelas.jurusan.trim().toUpperCase(),
    total_siswa_dapodik: Number(kelas.total_siswa_dapodik) || 30,
    status_aktif: kelas.status_aktif ?? true,
    dibuat_pada: kelas.dibuat_pada || nowIso,
    diperbarui_pada: nowIso,
  };

  try {
    const validJurusan = ['IPA', 'IPS', 'RPL', 'TKJ', 'AKUNTANSI', 'UMUM'].includes(
      newRecord.jurusan
    )
      ? newRecord.jurusan
      : 'UMUM';

    const { data, error } = await supabase
      .from('classes')
      .upsert({
        id: newRecord.id,
        id_sekolah: targetSchoolId,
        nama_kelas: newRecord.nama_kelas,
        tingkat: newRecord.tingkat,
        jurusan: validJurusan,
        total_siswa_dapodik: newRecord.total_siswa_dapodik,
        diperbarui_pada: nowIso,
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      newRecord.id = data.id;
    }
  } catch {
    // Offline fallback
  }

  const filteredLocal = localClasses.filter((c) => c.id !== newRecord.id);
  setLocalItem('mbg_classes_store', [newRecord, ...filteredLocal]);

  await logActivity(
    isEdit ? 'UPDATE_KELAS' : 'CREATE_KELAS',
    'classes',
    newRecord.id,
    null,
    newRecord,
    penggunaId || null
  );

  return newRecord;
}

export async function deleteClassRecord(
  id: string,
  schoolId?: string,
  penggunaId?: string | null
): Promise<Kelas[]> {
  const localClasses = getLocalItem<Kelas[]>('mbg_classes_store', []);
  const target =
    localClasses.find((c) => c.id === id) || SEED_CLASSES.find((c) => c.id === id);
  const updatedLocal = localClasses.filter((c) => c.id !== id);
  setLocalItem('mbg_classes_store', updatedLocal);

  try {
    await supabase.from('classes').delete().eq('id', id);
  } catch {
    // Offline fallback
  }

  await logActivity(
    'DELETE_KELAS',
    'classes',
    id,
    target || null,
    null,
    penggunaId || null
  );

  return getClassesBySchool(schoolId);
}

// ============================================================
// TAHAP 5: GUEST MODE AD-HOC VERIFICATION, CRM SCORING & STORAGE
// ============================================================

export async function verifyOrRegisterGuestStudent(params: {
  nama: string;
  noHp: string;
  classId: string;
}): Promise<{
  valid: boolean;
  message: string;
  profile?: StudentAuthProfile;
}> {
  const cleanName = (params.nama || '').trim();
  const normalizedPhone = normalizePhone628(params.noHp);

  if (!cleanName || cleanName.length < 2) {
    return {
      valid: false,
      message: 'Harap masukkan Nama Lengkap perwakilan atau siswa (minimal 2 karakter).',
    };
  }

  if (!isValidPhone628(normalizedPhone)) {
    return {
      valid: false,
      message: 'Nomor HP harus valid (contoh: 081234567890 atau 6281234567890).',
    };
  }

  // 1. Try matching existing student first
  const authRes = await authenticateStudentByNameAndPhone(cleanName, normalizedPhone);
  if (authRes.student) {
    return {
      valid: true,
      message: `Identitas terverifikasi sebagai ${authRes.student.nama_lengkap}.`,
      profile: authRes.student,
    };
  }

  // 2. Guest Mode Ad-Hoc: If not yet registered or phone differs, match by name in class roster or register ad-hoc guest identity
  const roster = await getClassRoster(params.classId);
  const matchedRoster = roster.find(
    (r) => r.nama_lengkap.trim().toLowerCase() === cleanName.toLowerCase()
  );

  const targetClass =
    SEED_CLASSES.find((c) => c.id === params.classId) ||
    (await getClassesBySchool()).find((c) => c.id === params.classId);

  const guestProfile: StudentAuthProfile = {
    nisn:
      matchedRoster?.nisn ||
      String(Math.floor(1000000000 + Math.random() * 9000000000)),
    nama_lengkap: matchedRoster?.nama_lengkap || cleanName,
    no_hp: normalizedPhone,
    id_kelas: params.classId,
    nama_kelas: targetClass?.nama_kelas || 'XII RPL 1',
    jurusan: targetClass?.jurusan || 'RPL',
    is_perwakilan_kelas: matchedRoster?.is_perwakilan_kelas ?? true,
  };

  // Persist guest identity to imported students so future logins also work
  const existingLocal = getLocalItem<ExtendedStudentProfile[]>('mbg_imported_students', []);
  setLocalItem('mbg_imported_students', [
    guestProfile,
    ...existingLocal.filter((s) => s.nisn !== guestProfile.nisn),
  ]);

  return {
    valid: true,
    message: `Verifikasi Ad-Hoc Guest berhasil (${guestProfile.nama_lengkap} • ${guestProfile.no_hp}).`,
    profile: guestProfile,
  };
}

export async function recordCrmBannerClick(params: {
  nisn: string | null;
  campaignId: string;
  poinInteraksi?: number;
}): Promise<{
  newLeadScore: number;
  newLeadStatus: 'COLD' | 'WARM' | 'HOT';
}> {
  const points = Number(params.poinInteraksi) || 1;
  const targetNisn = params.nisn || '1000000001';

  // Update local lead scores map
  const scoreMap = getLocalItem<Record<string, number>>('mbg_crm_lead_scores', {});
  const nextScore = (scoreMap[targetNisn] || 0) + points;
  scoreMap[targetNisn] = nextScore;
  setLocalItem('mbg_crm_lead_scores', scoreMap);

  const nextStatus: 'COLD' | 'WARM' | 'HOT' =
    nextScore >= 3 ? 'HOT' : nextScore >= 1 ? 'WARM' : 'COLD';

  // Insert to Supabase crm_click_logs (which triggers tr_crm_click_score in DB)
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.campaignId
    );
    if (isUuid) {
      await supabase.from('crm_click_logs').insert({
        nisn: targetNisn,
        id_campaign: params.campaignId,
        waktu_klik: new Date().toISOString(),
      });
    }
  } catch {
    // Offline fallback
  }

  await logActivity(
    'CRM_BANNER_CLICK',
    'crm_click_logs',
    null,
    null,
    {
      nisn: targetNisn,
      campaign_id: params.campaignId,
      added_points: points,
      new_lead_score: nextScore,
      new_lead_status: nextStatus,
    },
    null
  );

  return {
    newLeadScore: nextScore,
    newLeadStatus: nextStatus,
  };
}

export async function uploadFileWithFallback(params: {
  dataUrl: string;
  folder: 'sampel' | 'ttd';
  fileName?: string;
}): Promise<string> {
  if (!params.dataUrl) return '';

  // Try uploading to Supabase Storage bucket `mbg-assets` if online
  if (typeof navigator !== 'undefined' && navigator.onLine && params.dataUrl.startsWith('data:')) {
    try {
      const res = await fetch(params.dataUrl);
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const path = `${params.folder}/${params.fileName || Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('mbg-assets')
        .upload(path, blob, { upsert: true, contentType: blob.type });

      if (!error && data?.path) {
        const { data: pubUrl } = supabase.storage.from('mbg-assets').getPublicUrl(data.path);
        if (pubUrl?.publicUrl) {
          return pubUrl.publicUrl;
        }
      }
    } catch {
      // Fallback to Base64 DataURL for offline-first resilience
    }
  }

  return params.dataUrl;
}
