'use client';

import React, { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Label } from './Label';
import { FieldError, FieldHelper } from './FieldMessage';

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export function RadioGroup({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
  helperText,
  direction = 'vertical',
  className,
}: RadioGroupProps) {
  const reactId = useId();
  const groupName = name || `radio-group-${reactId}`;
  const errorId = `${groupName}-error`;
  const helperId = `${groupName}-helper`;

  const describedBy = [
    error ? errorId : null,
    helperText && !error ? helperId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <fieldset
      className={cn('space-y-2', className)}
      aria-describedby={describedBy}
      aria-invalid={!!error || undefined}
      disabled={disabled}
    >
      {label && (
        <Label as="legend" required={required} className="mb-1">
          {label}
        </Label>
      )}

      <div
        role="radiogroup"
        className={cn(
          'gap-2.5',
          direction === 'horizontal' ? 'grid grid-cols-1 sm:grid-cols-2' : 'space-y-2'
        )}
      >
        {options.map((opt) => {
          const isSelected = value === opt.value;
          const isDisabled = disabled || opt.disabled;
          const optionId = `${groupName}-${opt.value}`;

          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              className={cn(
                'min-h-[44px] flex items-start gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none micro-tap',
                isDisabled && 'opacity-55 cursor-not-allowed',
                isSelected
                  ? 'border-brand-blue bg-brand-blue-50/70 shadow-elev-1'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              )}
            >
              <input
                type="radio"
                id={optionId}
                name={groupName}
                value={opt.value}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => onChange(opt.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  'peer-focus-visible:ring-4 peer-focus-visible:ring-brand-blue/25',
                  isSelected ? 'border-brand-blue bg-white' : 'border-slate-300 bg-white'
                )}
                aria-hidden="true"
              >
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full bg-brand-blue transition-transform duration-150',
                    isSelected ? 'scale-100' : 'scale-0'
                  )}
                />
              </span>
              <span className="min-w-0 text-xs sm:text-sm">
                <span className="block font-bold text-slate-900">{opt.label}</span>
                {opt.description && (
                  <span className="block text-xs text-slate-600 mt-0.5">{opt.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {error && <FieldError id={errorId} message={error} />}
      {helperText && !error && <FieldHelper id={helperId} text={helperText} />}
    </fieldset>
  );
}

