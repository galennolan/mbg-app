'use client';

import React, { forwardRef, useEffect, useId, useRef, type ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldError, FieldHelper } from './FieldMessage';

export interface CheckboxProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  id?: string;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      checked,
      indeterminate = false,
      onChange,
      disabled = false,
      required = false,
      error,
      helperText,
      id,
      className,
    },
    ref
  ) => {
    const reactId = useId();
    const checkboxId = id || `checkbox-${reactId}`;
    const errorId = `${checkboxId}-error`;
    const helperId = `${checkboxId}-helper`;
    const internalRef = useRef<HTMLInputElement | null>(null);

    const setRefs = (node: HTMLInputElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const describedBy = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={cn('space-y-1', className)}>
        <label
          htmlFor={checkboxId}
          className={cn(
            'min-h-[44px] flex items-start gap-3 py-1.5 px-2 -mx-2 rounded-xl select-none cursor-pointer micro-tap',
            disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-surface-canvas/80'
          )}
        >
          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
            <input
              ref={setRefs}
              type="checkbox"
              id={checkboxId}
              checked={checked}
              disabled={disabled}
              required={required}
              onChange={(e) => onChange(e.target.checked)}
              aria-invalid={!!error || undefined}
              aria-describedby={describedBy}
              className="peer sr-only"
            />
            <div
              className={cn(
                'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-150',
                'peer-focus-visible:ring-4 peer-focus-visible:ring-brand-blue/25 peer-focus-visible:border-brand-blue',
                checked || indeterminate
                  ? 'bg-brand-blue border-brand-blue text-white shadow-elev-1 scale-100'
                  : 'bg-surface-card border-slate-300 text-transparent',
                error && 'border-red-500'
              )}
              aria-hidden="true"
            >
              {indeterminate ? (
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
              ) : (
                <Check
                  className={cn(
                    'w-3.5 h-3.5 stroke-[3] transition-transform duration-150',
                    checked ? 'scale-100' : 'scale-0'
                  )}
                />
              )}
            </div>
          </div>

          <div className="text-xs sm:text-sm leading-snug">
            <span className="font-bold text-text-primary">
              {label}
              {required && (
                <span className="text-brand-red ml-1" aria-hidden="true">
                  *
                </span>
              )}
            </span>
            {description && (
              <span className="block text-xs text-text-secondary font-normal mt-0.5">
                {description}
              </span>
            )}
          </div>
        </label>

        {error && <FieldError id={errorId} message={error} className="pl-8" />}
        {helperText && !error && <FieldHelper id={helperId} text={helperText} className="pl-8" />}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

