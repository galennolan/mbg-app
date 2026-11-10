/**
 * Phase 6: Lightweight Form Validation Rules & Schema Helpers
 * Validates on blur and submit without external dependency bloat.
 */

export type ValidatorFn<T = any> = (value: T, allValues?: Record<string, any>) => string | undefined;

export type ValidationSchema<T extends Record<string, any>> = {
  [K in keyof T]?: ValidatorFn<T[K]> | ValidatorFn<T[K]>[];
};

export const validators = {
  required:
    (fieldLabel = 'Kolom ini'): ValidatorFn =>
    (val) => {
      if (val === undefined || val === null) return `${fieldLabel} wajib diisi.`;
      if (typeof val === 'string' && !val.trim()) return `${fieldLabel} wajib diisi.`;
      if (Array.isArray(val) && val.length === 0) return `Pilih minimal satu ${fieldLabel}.`;
      return undefined;
    },

  minLength:
    (min: number, fieldLabel = 'Kolom ini'): ValidatorFn<string> =>
    (val) => {
      if (!val) return undefined;
      if (val.trim().length < min) {
        return `${fieldLabel} minimal ${min} karakter.`;
      }
      return undefined;
    },

  email:
    (fieldLabel = 'Alamat email'): ValidatorFn<string> =>
    (val) => {
      if (!val || !val.trim()) return undefined;
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(val.trim())) {
        return `${fieldLabel} tidak valid (contoh: nama@sekolah.sch.id).`;
      }
      return undefined;
    },

  phone628:
    (fieldLabel = 'Nomor WhatsApp'): ValidatorFn<string> =>
    (val) => {
      if (!val || !val.trim()) return undefined;
      const cleaned = val.replace(/\D/g, '');
      if (!/^628\d{7,12}$/.test(cleaned)) {
        return `${fieldLabel} wajib berformat 628xxx (10-15 digit).`;
      }
      return undefined;
    },

  nisn10:
    (fieldLabel = 'NISN'): ValidatorFn<string> =>
    (val) => {
      if (!val || !val.trim()) return undefined;
      if (!/^\d{10}$/.test(val.trim())) {
        return `${fieldLabel} harus terdiri dari 10 digit angka.`;
      }
      return undefined;
    },

  numberRange:
    (min: number, max: number, fieldLabel = 'Nilai'): ValidatorFn<number | string> =>
    (val) => {
      const num = Number(val);
      if (Number.isNaN(num)) return `${fieldLabel} harus berupa angka.`;
      if (num < min || num > max) {
        return `${fieldLabel} harus berada di antara ${min} dan ${max}.`;
      }
      return undefined;
    },
};

export function validateFieldValue<T extends Record<string, any>>(
  key: keyof T,
  value: any,
  schema: ValidationSchema<T>,
  allValues?: T
): string | undefined {
  const rule = schema[key];
  if (!rule) return undefined;

  const rules = Array.isArray(rule) ? rule : [rule];
  for (const fn of rules) {
    const err = fn(value, allValues);
    if (err) return err;
  }
  return undefined;
}

export function validateAllFields<T extends Record<string, any>>(
  values: T,
  schema: ValidationSchema<T>
): Record<string, string | undefined> {
  const errors: Record<string, string | undefined> = {};
  for (const key of Object.keys(schema) as (keyof T)[]) {
    const err = validateFieldValue(key, values[key], schema, values);
    if (err) {
      errors[String(key)] = err;
    }
  }
  return errors;
}

