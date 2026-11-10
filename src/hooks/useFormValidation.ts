'use client';

import { useState, useCallback } from 'react';
import {
  validateFieldValue,
  validateAllFields,
  type ValidationSchema,
} from '@/lib/validation';
import { useFieldFocus } from './useFieldFocus';

/**
 * Phase 6: Standardized Form Validation Hook
 * Validates on blur per UX guideline (Priority 8), shows inline errors,
 * and focuses the first invalid field on submit.
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  schema: ValidationSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { focusFirstError } = useFieldFocus();

  const setFieldValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value };
        // If field was already touched and had an error, re-validate immediately so error clears when fixed
        if (touched[String(key)] && errors[String(key)]) {
          const err = validateFieldValue(key, value, schema, next);
          setErrors((prevErr) => ({ ...prevErr, [String(key)]: err }));
        }
        return next;
      });
    },
    [schema, touched, errors]
  );

  const handleFieldBlur = useCallback(
    (key: keyof T) => {
      setTouched((prev) => ({ ...prev, [String(key)]: true }));
      const err = validateFieldValue(key, values[key], schema, values);
      setErrors((prev) => ({ ...prev, [String(key)]: err }));
    },
    [schema, values]
  );

  const validateForm = useCallback((): boolean => {
    const nextErrors = validateAllFields(values, schema);
    setErrors(nextErrors);
    const allTouched: Record<string, boolean> = {};
    for (const k of Object.keys(schema)) {
      allTouched[k] = true;
    }
    setTouched(allTouched);

    const hasError = Object.values(nextErrors).some(Boolean);
    if (hasError) {
      focusFirstError(nextErrors);
    }
    return !hasError;
  }, [values, schema, focusFirstError]);

  const resetForm = useCallback(
    (nextValues?: T) => {
      setValues(nextValues || initialValues);
      setErrors({});
      setTouched({});
    },
    [initialValues]
  );

  return {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    setFieldValue,
    handleFieldBlur,
    validateForm,
    resetForm,
  };
}

