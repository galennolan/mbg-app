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
  setActiveSchoolId: () => { },
  student: null,
  isStudent: false,
  isGuest: true,
  guestIdentity: null,
  setGuestIdentity: () => { },
  loading: true,
  signIn: async () => ({}),
  signInStudent: async () => ({}),
  updateProfileName: async () => { },
  signOut: async () => { },
  refreshProfile: async () => { },
});

const STUDENT_STORAGE_KEY = 'mbg_student_session';
const STAFF_STORAGE_KEY = 'mbg_staff_session';
const GUEST_STORAGE_KEY = 'mbg_guest_identity';
const ACTIVE_SCHOOL_STORAGE_KEY = 'mbg_active_school_id';

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

  const saveStaffLocally = (profile: Pengguna | null) => {
    if (typeof window === 'undefined') return;
    if (profile) {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(profile));
      const schoolId = profile.id_sekolah || DEFAULT_SCHOOL_ID;
      if (profile.peran !== 'super_admin' && profile.id_sekolah) {
        localStorage.setItem(ACTIVE_SCHOOL_STORAGE_KEY, schoolId);
        setActiveSchoolIdState(schoolId);
      }
      syncAuthCookies(profile.peran, schoolId);
    } else {
      localStorage.removeItem(STAFF_STORAGE_KEY);
      syncAuthCookies(null, null);
    }
  };

  const fetchProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('pengguna')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data || data.status_aktif === false) {
        setUser(null);
        saveStaffLocally(null);
        return false;
      }

      const profile = data as Pengguna;
      setUser(profile);
      saveStaffLocally(profile);
      return true;
    } catch {
      setUser(null);
      saveStaffLocally(null);
      return false;
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
          await fetchProfile(session.user.id);
        } else if (typeof window !== 'undefined' && localStorage.getItem(STAFF_STORAGE_KEY)) {
          // Sesi petugas tanpa sesi Supabase asli (sisa mode demo lama) tidak dipercaya lagi.
          localStorage.removeItem(STAFF_STORAGE_KEY);
          syncAuthCookies(null, null);
          setUser(null);
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
        await fetchProfile(session.user.id);
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
        const ok = await fetchProfile(data.user.id);
        if (!ok) {
          await supabase.auth.signOut();
          setAuthUser(null);
          return {
            error:
              'Akun Anda belum terdaftar atau dinonaktifkan di tabel pengguna. Hubungi Super Admin.',
          };
        }
        return {};
      }

      if (error && (error as { code?: string }).code === 'email_provider_disabled') {
        return {
          error:
            'Login email dinonaktifkan di Supabase. Aktifkan di Authentication → Sign In / Providers → Email.',
        };
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

  const refreshProfile = async () => {
    if (authUser) {
      await fetchProfile(authUser.id);
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
