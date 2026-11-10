import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns current date in Asia/Jakarta as YYYY-MM-DD
 */
export function getJakartaDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  return parts; // 'YYYY-MM-DD'
}

/**
 * Format timestamp into Indonesian WIB display: e.g. "10:35:12 WIB"
 */
export function formatWIBTime(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const trimmed = String(dateString).trim();
    // If string is already in HH:mm or HH:mm:ss format, e.g. "09:30" or "09:30 WIB"
    if (/^\d{1,2}:\d{2}(:\d{2})?(\s*WIB)?$/i.test(trimmed)) {
      return trimmed.toUpperCase().includes('WIB') ? trimmed : `${trimmed} WIB`;
    }

    const d = new Date(trimmed);
    if (isNaN(d.getTime())) {
      return trimmed;
    }

    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d) + ' WIB';
  } catch (e) {
    return String(dateString);
  }
}

/**
 * Format timestamp into Indonesian full date: e.g. "Rabu, 4 November 2026"
 */
export function formatIndonesianDate(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    // If it's a date only string "YYYY-MM-DD", create local noon
    const d = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T12:00:00+07:00');
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  } catch (e) {
    return dateString;
  }
}

/**
 * Format date string (YYYY-MM-DD or ISO) into dd-mm-yyyy: e.g. "10-11-2026"
 */
export function formatDateDDMMYYYY(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    // Handle YYYY-MM-DD or ISO string
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      const [yyyy, mm, dd] = dateString.trim().split('-');
      return `${dd}-${mm}-${yyyy}`;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d).replace(/\//g, '-');
  } catch (e) {
    return dateString;
  }
}

/**
 * Format timestamp into Indonesian full datetime: e.g. "4 Nov 2026, 10:35:12 WIB"
 */
export function formatIndonesianDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d);
    return dateFormatted + ' WIB';
  } catch (e) {
    return dateString;
  }
}

