# UI/UX Improvement Plan - Nutri Kampus Hub

**Date:** 2024-11-10
**Version:** 1.0
**Status:** Plan Phase (Read-Only)

---

## 1. Executive Summary

Based on user requirements, this plan addresses 6 key improvement areas across the Nutri Kampus Hub application:

1. **Kedatangan MBG Page** - Hide photo sample feature, rename button
2. **Navbar** - Add link to BSI logo
3. **Laporan Page** - Date format fix, distribution time for individuals, hide NISN column based on role, fix missing time display
4. **Navbar** - BSI logo link to PMB UBSI Surakarta

---

## 2. Detailed Requirements & Technical Analysis

### 2.1 Kedatangan MBG Page (`/kedatangan`)

#### Current State
- File: `src/app/kedatangan/page.tsx` (677 lines)
- Uses `QualityCheckCard` component for organoleptic QC
- `QualityCheckCard` has photo capture feature (`photoUrl`, `onPhotoChange`)
- Main button text: "Konfirmasi MBG Datang & Buka Distribusi" (line 395)
- FAB button text: "MBG Datang" (line 616)

#### Required Changes
| # | Change | File/Component | Action |
|---|--------|----------------|--------|
| 1 | Hide photo sample feature | `QualityCheckCard.tsx` | Remove photo capture section (lines 174-233) or add `showPhotoCapture` prop |
| 2 | Rename "Trigger MBG Datang" to "Lapor MBG Datang" | `kedatangan/page.tsx` | Update button text in 3 places (lines 395, 560, 616) |
| 3 | Update FAB button | `kedatangan/page.tsx` line 616 | "MBG Datang" to "Lapor MBG Datang" |

#### Technical Notes
- `QualityCheckCard` receives `photoUrl` and `onPhotoChange` props from `kedatangan/page.tsx` (lines 358-359)
- Photo state managed in parent: `fotoSampelUrl` state (line 66)
- Consider adding `showPhotoCapture?: boolean` prop to `QualityCheckCard` for future flexibility

---

### 2.2 Navbar - BSI Logo Link (`src/components/Navbar.tsx`)

#### Current State
- Lines 419-432: Logo section with "BSI" text in clickable div
- Current: Links to "/" (home page)
- Need: Link to `https://pmbubsi.id/kampus/surakarta`

#### Required Changes
| # | Change | Location | Action |
|---|--------|----------|--------|
| 1 | Update BSI logo link | Line 420-422 | Change `href="/"` to `href="https://pmbubsi.id/kampus/surakarta"` with `target="_blank" rel="noopener noreferrer"` |
| 2 | Add external link icon | Optional | Add `ExternalLink` icon next to "BSI" text for UX clarity |

---

### 2.3 Laporan Page (`/laporan`) - `src/app/laporan/page.tsx`

#### Current State Analysis

| Aspect | Current | Required |
|--------|---------|----------|
| Date format | Uses `formatIndonesianDate` (dd MMMM yyyy) | Change to dd-mm-yyyy |
| Distribution time per student | Shows in table column "Waktu (WIB)" | Keep but ensure shows for individual students |
| NISN column | Visible for all roles in table & Excel | Hide for Guru Piket & Kepala Sekolah; show only for Super Admin |
| First/Last confirmation time | Lines 327-341 display `waktuPertama`/`waktuTerakhir` | Bug: times not showing - need debug |

#### Detailed Required Changes

##### 2.3.1 Date Format (dd-mm-yyyy)
- Current: Uses `formatIndonesianDate()` from `@/lib/utils`
- Need: Create new utility `formatDateDDMMYYYY()` or modify existing
- Apply to: DatePicker display, table headers, print headers, export filenames

##### 2.3.2 Distribution Time for Individuals
- Current: Tab "Laporan Per Siswa" shows "Waktu (WIB)" column (line 419, 445)
- Need: Ensure `waktu_penerimaan` is populated for each student record
- Current data synthesis (lines 83-94) uses `st.waktu_ambil || (st.sudah_ambil ? new Date().toISOString() : null)` - may need real timestamp from database

##### 2.3.3 Hide NISN Column Based on Role
| Role | Table Display | Excel Export |
|------|---------------|--------------|
| Super Admin | Show | Show |
| Guru Piket | Hide | Hide |
| Kepala Sekolah | Hide | Hide |

Implementation: Pass `role` to export functions and conditionally include NISN column

##### 2.3.4 Fix First/Last Confirmation Time Bug
Current code (lines 122-126, 327-341):
```typescript
const waktuPertama = validDiterima.length > 0 ? validDiterima[0].waktu_penerimaan : null;
const waktuTerakhir = validDiterima.length > 0 ? validDiterima[validDiterima.length - 1].waktu_penerimaan : null;
```
Display: Lines 327-341 use `formatWIBTime()` 

**Potential Issues:**
1. `validDiterima` array may not be sorted by `waktu_penerimaan`
2. `waktu_penerimaan` may be null/undefined for some records
3. Synthetic data generation (line 92) uses `new Date().toISOString()` - all same timestamp

**Fix:** Sort `validDiterima` by `waktu_penerimaan` before picking first/last

---

## 3. Implementation Plan

### Phase 1: Quick Wins (Low Risk)
| Task | Files | Est. Time |
|------|-------|-----------|
| 1. Rename "MBG Datang" to "Lapor MBG Datang" | `kedatangan/page.tsx` (3 locations) | 15 min |
| 2. Update BSI logo link in Navbar | `Navbar.tsx` (1 location) | 10 min |
| 3. Add `showPhotoCapture` prop to QualityCheckCard | `QualityCheckCard.tsx` + `kedatangan/page.tsx` | 30 min |

### Phase 2: Laporan Page Core Fixes (Medium Risk)
| Task | Files | Est. Time |
|------|-------|-----------|
| 4. Add dd-mm-yyyy date utility | `src/lib/utils.ts` + `laporan/page.tsx` | 30 min |
| 5. Fix first/last confirmation time sorting | `laporan/page.tsx` (lines 122-126) | 20 min |
| 6. Role-based NISN column hiding (table) | `laporan/page.tsx` (Tab Siswa) | 30 min |
| 7. Role-based NISN column hiding (Excel/CSV export) | `laporan/page.tsx` (export functions) | 30 min |

### Phase 3: Photo Feature & Polish (Low Risk)
| Task | Files | Est. Time |
|------|-------|-----------|
| 8. Add `showPhotoCapture` prop to hide photo section | `QualityCheckCard.tsx` + `kedatangan/page.tsx` | 30 min |
| 9. Update button texts in Kedatangan | `kedatangan/page.tsx` | 15 min |
| 10. Update Navbar BSI logo link | `Navbar.tsx` | 15 min |

---

## 4. Role-Based Access Matrix (for NISN Column)

| Feature | Super Admin | Guru Piket | Kepala Sekolah | Siswa |
|---------|-------------|------------|----------------|-------|
| View NISN in Laporan table | Yes | No | No | N/A |
| Export NISN in Excel/CSV | Yes | No | No | N/A |
| View NISN in student profile | Yes | No | No | Yes (own) |
| Edit student data | Yes | No | No | No |

**Implementation:** Use `role` from `useAuth()` hook in `LaporanPage`:
```typescript
const isSuperAdmin = role === 'super_admin';
const showNISN = isSuperAdmin;
```

---

## 5. Files to Modify

### Primary Files
1. `src/app/kedatangan/page.tsx` - Button texts, photo feature
2. `src/components/operasional/QualityCheckCard.tsx` - Photo capture prop
3. `src/components/Navbar.tsx` - BSI logo link
4. `src/app/laporan/page.tsx` - Date format, NISN hiding, time sorting, exports
5. `src/lib/utils.ts` - New date formatting utility

### Supporting Files
- `src/lib/auth-context.tsx` - Role definitions (already has `super_admin`, `guru_piket`, `kepala_sekolah`)

---

## 6. Testing Checklist

### Manual Testing
- [ ] Button text changes visible in Kedatangan page
- [ ] BSI logo opens PMB UBSI Surakarta in new tab
- [ ] Date displays as dd-mm-yyyy in Laporan
- [ ] NISN column hidden for Guru Piket login
- [ ] NISN column hidden for Kepala Sekolah login
- [ ] NISN column visible for Super Admin login
- [ ] Excel export excludes NISN for non-super-admin
- [ ] CSV export excludes NISN for non-super-admin
- [ ] First/Last confirmation times display correctly
- [ ] Photo sample section hidden in Kedatangan page

### Role Testing Accounts
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@mbg.sekolah.id | Password123! |
| Guru Piket | guru@mbg.sekolah.id | Password123! |
| Kepala Sekolah | kepsek@mbg.sekolah.id | Password123! |

---

## 8. Dependencies & Prerequisites

- No new npm packages required
- Uses existing: `xlsx`, `lucide-react`, `date-fns` (via utils)
- Role system already implemented in `auth-context.tsx`

---

## 9. Approval & Next Steps

**Plan Status:** Ready for Implementation

**Required Approvals:**
- [ ] Confirm button text changes ("Lapor MBG Datang")
- [ ] Confirm PMB UBSI Surakarta URL is correct
- [ ] Confirm dd-mm-yyyy date format requirement
- [ ] Confirm NISN hiding matrix

**Next Action:** Upon approval, proceed to Phase 1 implementation.

---

*Document generated by AI Assistant - Plan Mode*
*Total estimated effort: ~3.5 hours*
