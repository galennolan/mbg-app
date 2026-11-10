'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import { FieldError, FieldHelper } from './FieldMessage';

export interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  id?: string;
  className?: string;
}

export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  error,
  helperText,
  id,
  className,
}: SwitchProps) {
  const reactId = useId();
  const switchId = id || `switch-${reactId}`;
  const errorId = `${switchId}-error`;
  const helperId = `${switchId}-helper`;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="min-h-[44px] flex items-center justify-between gap-3 py-1">
        <label htmlFor={switchId} className="cursor-pointer select-none">
          <span className="block text-xs sm:text-sm font-bold text-slate-900">{label}</span>
          {description && (
            <span className="block text-xs text-slate-600 mt-0.5">{description}</span>
          )}
        </label>

        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={cn(
            'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out micro-tap',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            checked ? 'bg-brand-green' : 'bg-slate-300'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-out',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>
      {error && <FieldError id={errorId} message={error} />}
      {helperText && !error && <FieldHelper id={helperId} text={helperText} />}
    </div>
  );
}

