'use client';

import { useCallback } from 'react';

/**
 * Phase 6: Focus Management Utility Hook
 * Automatically focuses and scrolls to the first invalid field upon form submission.
 */
export function useFieldFocus() {
  const focusFirstError = useCallback((errors: Record<string, string | undefined>) => {
    const firstKey = Object.keys(errors).find((k) => Boolean(errors[k]));
    if (!firstKey || typeof document === 'undefined') return;

    const target =
      document.getElementById(firstKey) ||
      document.querySelector<HTMLElement>(`[name="${firstKey}"]`) ||
      document.getElementById(`input-${firstKey}`) ||
      document.getElementById(`select-${firstKey}`);

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        target.focus();
      }, 50);
    }
  }, []);

  return { focusFirstError };
}

