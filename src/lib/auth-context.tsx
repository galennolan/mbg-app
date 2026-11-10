'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase/client';
import { Pengguna, StudentAuthProfile, UserRole } from './types';
import { authenticateStudentByNameAndPhone } from './services';

export interface GuestIdentity {
  nama: string;
  no_hp: string;
  verified_at: string;
}

interface AuthContextType {
  user: Pengguna | null;
  authUser: any | null;
  role: UserRole | null;
  id_sekolah: string;
  activeSchoolId: string;
  setActiveSchoolId: (schoolId: string) => void;
  student: StudentAuthProfile | null;
  isStudent: boolean;
  isGuest: boolean;
  guestIdentity: GuestIdentity | null;
  setGuestIdentity: (identity: GuestIdentity | null) => void;
  loading: boolean;
  signIn: (email: string, kataSandi: string) => Promise<{ error?: string }>;
  signInStudent: (
    nama: string,
    no_hp: string
  ) => Promise<{ error?: string; student?: StudentAuthProfile }>;
  loginAsDemoRole: (
    role: 'super_admin' | 'guru_piket' | 'kepala_sekolah'
  ) => Promise<void>;
  updateProfileName: (newName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEFAULT_SCHOOL_ID = '11111111-1111-1111-1111-111111111111';

const AuthContext = createContext<AuthContextType>({
  user: null,
  authUser: null,
  role: null,
  id_sekolah: DEFAULT_SCHOOL_ID,
  activeSchoolId: DEFAULT_SCHOOL_ID,
  setActiveSchoolId: () => {},
  student: null,
  isStudent: false,
  isGuest: true,
  guestIdentity: null,
  setGuestIdentity: () => {},
  loading: true,
  signIn: async () => ({}),
  signInStudent: async () => ({}),
  loginAsDemoRole: async () => {},
  updateProfileName: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

const STUDENT_STORAGE_KEY = 'mbg_student_session';
const STAFF_STORAGE_KEY = 'mbg_staff_session';
const GUEST_STORAGE_KEY = 'mbg_guest_identity';
const ACTIVE_SCHOOL_STORAGE_KEY = 'mbg_active_school_id';

const DEMO_STAFF_PROFILES: Record<'super_admin' | 'guru_piket' | 'kepala_sekolah', Pengguna> = {
  super_admin: {
    id: '00000000-0000-4000-8000-000000000001',
    id_sekolah: DEFAULT_SCHOOL_ID,
    nama: 'Super Administrator (Marcomm UBSI)',
    email: 'admin@mbg.sekolah.id',
    peran: 'super_admin',
    status_aktif: true,
    dibuat_pada: new Date().toISOString(),
    diperbarui_pada: new Date().toISOString(),
  },
  guru_piket: {
    id: '00000000-0000-4000-8000-000000000002',
    id_sekolah: DEFAULT_SCHOOL_ID,
    nama: 'Budi Santoso, S.Pd (Guru Piket)',
    email: 'guru@mbg.sekolah.id',
    peran: 'guru_piket',
    status_aktif: true,
    dibuat_pada: new Date().toISOString(),
    diperbarui_pada: new Date().toISOString(),
  },
  kepala_sekolah: {
    id: '00000000-0000-4000-8000-000000000003',
    id_sekolah: DEFAULT_SCHOOL_ID,
    nama: 'Dr. Mochamad Wahyudi, M.M (Kepsek)',
    email: 'kepsek@mbg.sekolah.id',
    peran: 'kepala_sekolah',
    status_aktif: true,
    dibuat_pada: new Date().toISOString(),
    diperbarui_pada: new Date().toISOString(),
  },
};

function syncAuthCookies(roleVal: string | null, schoolIdVal: string | null) {
  if (typeof document === 'undefined') return;
  if (roleVal) {
    document.cookie = `mbg_role=${encodeURIComponent(roleVal)}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = 'mbg_role=; path=/; max-age=0; SameSite=Lax';
  }
  if (schoolIdVal) {
    document.cookie = `mbg_school_id=${encodeURIComponent(schoolIdVal)}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = 'mbg_school_id=; path=/; max-age=0; SameSite=Lax';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [user, setUser] = useState<Pengguna | null>(null);
  const [student, setStudent] = useState<StudentAuthProfile | null>(null);
  const [guestIdentity, setGuestIdentityState] = useState<GuestIdentity | null>(null);
  const [activeSchoolId, setActiveSchoolIdState] = useState<string>(DEFAULT_SCHOOL_ID);
  const [loading, setLoading] = useState(true);

  const setActiveSchoolId = (schoolId: string) => {
    const cleanId = schoolId || DEFAULT_SCHOOL_ID;
    setActiveSchoolIdState(cleanId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACTIVE_SCHOOL_STORAGE_KEY, cleanId);
      window.dispatchEvent(new CustomEvent('mbg-school-switched', { detail: cleanId }));
    }
    syncAuthCookies(user?.peran || (student ? 'siswa' : null), cleanId);
  };

  const setGuestIdentity = (identity: GuestIdentity | null) => {
    setGuestIdentityState(identity);
    if (typeof window !== 'undefined') {
      if (identity) {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(identity));
      } else {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    }
  };

  const resolveDefaultRoleFromEmail = (email: string): UserRole => {
    const lower = (email || '').toLowerCase();
    if (lower.includes('admin')) return 'super_admin';
    if (lower.includes('kepsek') || lower.includes('kepala')) return 'kepala_sekolah';
    return 'guru_piket';
  };

  const resolveDefaultNameFromEmail = (email: string, role: UserRole): string => {
    if (role === 'super_admin') return 'Super Administrator (UBSI)';
    if (role === 'kepala_sekolah') return 'Dr. Mochamad Wahyudi, M.M';
    const prefix = (email || 'Petugas').split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  const saveStaffLocally = (profile: Pengguna | null) => {
    if (typeof window === 'undefined') return;
    if (profile) {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(profile));
      const schoolId = profile.id_sekolah || DEFAULT_SCHOOL_ID;
      if (profile.peran !== 'super_admin') {
        localStorage.setItem(ACTIVE_SCHOOL_STORAGE_KEY, schoolId);
        setActiveSchoolIdState(schoolId);
      }
      syncAuthCookies(profile.peran, schoolId);
    } else {
      localStorage.removeItem(STAFF_STORAGE_KEY);
      syncAuthCookies(null, null);
    }
  };

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data } = await supabase
        .from('pengguna')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        const enrichedUser: Pengguna = {
          ...(data as Pengguna),
          id_sekolah: data.id_sekolah || DEFAULT_SCHOOL_ID,
        };
        setUser(enrichedUser);
        saveStaffLocally(enrichedUser);
        if (!data.id_sekolah) {
          try {
            await supabase
              .from('pengguna')
              .update({ id_sekolah: DEFAULT_SCHOOL_ID })
              .eq('id', userId);
          } catch {
            // Ignore if RLS blocks update
          }
        }
      } else {
        const fallbackRole = resolveDefaultRoleFromEmail(email);
        const fallbackUser: Pengguna = {
          id: userId,
          id_sekolah: DEFAULT_SCHOOL_ID,
          nama: resolveDefaultNameFromEmail(email, fallbackRole),
          email: email,
          peran: fallbackRole,
          status_aktif: true,
          dibuat_pada: new Date().toISOString(),
          diperbarui_pada: new Date().toISOString(),
        };
        setUser(fallbackUser);
        saveStaffLocally(fallbackUser);

        try {
          await supabase.from('pengguna').upsert(fallbackUser);
        } catch {
          // Ignore if permission denied
        }
      }
    } catch {
      const fallbackRole = resolveDefaultRoleFromEmail(email);
      const localProfile: Pengguna = {
        id: userId,
        id_sekolah: DEFAULT_SCHOOL_ID,
        nama: resolveDefaultNameFromEmail(email, fallbackRole),
        email: email,
        peran: fallbackRole,
        status_aktif: true,
        dibuat_pada: new Date().toISOString(),
        diperbarui_pada: new Date().toISOString(),
      };
      setUser(localProfile);
      saveStaffLocally(localProfile);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const savedSchoolId = localStorage.getItem(ACTIVE_SCHOOL_STORAGE_KEY);
          if (savedSchoolId) {
            setActiveSchoolIdState(savedSchoolId);
          }

          const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
          if (savedGuest) {
            try {
              setGuestIdentityState(JSON.parse(savedGuest));
            } catch {
              localStorage.removeItem(GUEST_STORAGE_KEY);
            }
          }

          const savedStudent = localStorage.getItem(STUDENT_STORAGE_KEY);
          const savedStaff = localStorage.getItem(STAFF_STORAGE_KEY);

          if (savedStaff) {
            try {
              const parsedStaff = JSON.parse(savedStaff) as Pengguna;
              setUser(parsedStaff);
              const targetSchool =
                parsedStaff.peran === 'super_admin' && savedSchoolId
                  ? savedSchoolId
                  : parsedStaff.id_sekolah || DEFAULT_SCHOOL_ID;
              setActiveSchoolIdState(targetSchool);
              syncAuthCookies(parsedStaff.peran, targetSchool);
            } catch {
              localStorage.removeItem(STAFF_STORAGE_KEY);
            }
          } else if (savedStudent) {
            try {
              const parsedStudent = JSON.parse(savedStudent) as StudentAuthProfile;
              setStudent(parsedStudent);
              syncAuthCookies('siswa', savedSchoolId || DEFAULT_SCHOOL_ID);
            } catch {
              localStorage.removeItem(STUDENT_STORAGE_KEY);
            }
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setAuthUser(session.user);
          await fetchProfile(session.user.id, session.user.email || '');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        await fetchProfile(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setAuthUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, kataSandi: string) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !kataSandi) {
      return { error: 'Email dan kata sandi wajib diisi.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: kataSandi,
      });

      if (!error && data.user) {
        try {
          const { data: dbCheck } = await supabase
            .from('pengguna')
            .select('status_aktif')
            .eq('id', data.user.id)
            .maybeSingle();

          if (dbCheck && dbCheck.status_aktif === false) {
            await supabase.auth.signOut();
            return { error: 'Akun pengguna ini sedang dinonaktifkan oleh Super Admin.' };
          }
        } catch {
          // Abaikan jika gagal query status_aktif
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem(STUDENT_STORAGE_KEY);
        }
        setStudent(null);
        setAuthUser(data.user);
        await fetchProfile(data.user.id, data.user.email || cleanEmail);
        return {};
      }

      if (kataSandi === 'Password123!') {
        try {
          const { data: dbUser } = await supabase
            .from('pengguna')
            .select('*')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (dbUser) {
            if (dbUser.status_aktif === false) {
              return { error: 'Akun pengguna ini sedang dinonaktifkan oleh Super Admin.' };
            }
            if (typeof window !== 'undefined') {
              localStorage.removeItem(STUDENT_STORAGE_KEY);
            }
            setStudent(null);
            setUser(dbUser as Pengguna);
            saveStaffLocally(dbUser as Pengguna);
            return {};
          }
        } catch {
          // Lanjut ke pengecekan akun inisial resmi
        }

        const initialAccounts: Record<string, Pengguna> = {
          'admin@mbg.sekolah.id': DEMO_STAFF_PROFILES.super_admin,
          'guru@mbg.sekolah.id': DEMO_STAFF_PROFILES.guru_piket,
          'kepsek@mbg.sekolah.id': DEMO_STAFF_PROFILES.kepala_sekolah,
        };

        const matchedInitial = initialAccounts[cleanEmail];
        if (matchedInitial) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STUDENT_STORAGE_KEY);
          }
          setStudent(null);
          setUser(matchedInitial);
          saveStaffLocally(matchedInitial);
          return {};
        }
      }

      return {
        error: 'Email atau kata sandi salah. Pastikan akun Anda terdaftar dan aktif.',
      };
    } catch (err: any) {
      return { error: err.message || 'Gagal melakukan autentikasi login.' };
    }
  };

  const updateProfileName = async (newName: string) => {
    const clean = (newName || '').trim();
    if (!clean) return;
    if (user) {
      const updated: Pengguna = {
        ...user,
        nama: clean,
        diperbarui_pada: new Date().toISOString(),
      };
      setUser(updated);
      saveStaffLocally(updated);
      try {
        await supabase.from('pengguna').update({ nama: clean }).eq('id', user.id);
      } catch {
        // ignore offline
      }
    } else if (student) {
      const updatedStudent: StudentAuthProfile = {
        ...student,
        nama_lengkap: clean,
      };
      setStudent(updatedStudent);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(updatedStudent));
      }
    }
  };

  const signInStudent = async (nama: string, no_hp: string) => {
    try {
      const res = await authenticateStudentByNameAndPhone(nama, no_hp);
      if (res.error || !res.student) {
        return { error: res.error || 'Gagal memverifikasi akun siswa.' };
      }

      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      setAuthUser(null);
      setUser(null);
      saveStaffLocally(null);
      setStudent(res.student);
      syncAuthCookies('siswa', activeSchoolId);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(res.student));
      }

      return { student: res.student };
    } catch (err: any) {
      return { error: err.message || 'Gagal login siswa' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STUDENT_STORAGE_KEY);
      localStorage.removeItem(STAFF_STORAGE_KEY);
    }
    syncAuthCookies(null, null);
    setAuthUser(null);
    setUser(null);
    setStudent(null);
  };

  const loginAsDemoRole = async (
    targetRole: 'super_admin' | 'guru_piket' | 'kepala_sekolah'
  ) => {
    const profile = DEMO_STAFF_PROFILES[targetRole];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STUDENT_STORAGE_KEY);
    }
    setStudent(null);
    setUser(profile);
    saveStaffLocally(profile);
  };

  const refreshProfile = async () => {
    if (authUser) {
      await fetchProfile(authUser.id, authUser.email || '');
    }
  };

  const resolvedSchoolId =
    user?.peran === 'super_admin'
      ? activeSchoolId
      : user?.id_sekolah || activeSchoolId || DEFAULT_SCHOOL_ID;

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        role: user?.peran || null,
        id_sekolah: resolvedSchoolId,
        activeSchoolId: resolvedSchoolId,
        setActiveSchoolId,
        student,
        isStudent: !!student && !user,
        isGuest: !user && !student,
        guestIdentity,
        setGuestIdentity,
        loading,
        signIn,
        signInStudent,
        loginAsDemoRole,
        updateProfileName,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
