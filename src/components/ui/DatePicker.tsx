'use client';

import React, { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Calendar } from 'lucide-react';
import { cn, formatIndonesianDate } from '@/lib/utils';
import { Label } from './Label';
import { FieldError, FieldHelper } from './FieldMessage';
import type { BaseFieldProps } from './Input';

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>,
    BaseFieldProps {
  showFormattedBadge?: boolean;
  showPreview?: boolean;
  containerClassName?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      required,
      helperText,
      error,
      value,
      showFormattedBadge = true,
      showPreview,
      className,
      containerClassName,
      id,
      disabled,
      'aria-describedby': externalDescribedBy,
      ...props
    },
    ref
  ) => {
    const displayBadge = showPreview !== undefined ? showPreview : showFormattedBadge;
    const reactId = useId();
    const dateId =
      id || (label ? `date-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : `date-${reactId}`);
    const errorId = `${dateId}-error`;
    const helperId = `${dateId}-helper`;

    const describedByParts = [
      externalDescribedBy,
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ].filter(Boolean);
    const ariaDescribedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    const formattedPreview =
      showFormattedBadge && typeof value === 'string' && value.length >= 10
        ? formatIndonesianDate(value)
        : null;

    const inputControl = (
      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-blue"
          aria-hidden="true"
        >
          <Calendar className="w-4 h-4" />
        </div>
        <input
          ref={ref}
          id={dateId}
          type="date"
          value={value}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-required={required || undefined}
          aria-describedby={ariaDescribedBy}
          aria-label={label || 'Pilih tanggal'}
          className={cn(
            'w-full min-h-[44px] pl-10 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900',
            'shadow-elev-1 transition-all duration-150 cursor-pointer',
            'focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 focus:outline-none',
            'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:border-red-600 focus:ring-red-500/15',
            className
          )}
          {...props}
        />
      </div>
    );

    if (!label && !error && !helperText) {
      return inputControl;
    }

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <Label
            htmlFor={dateId}
            required={required}
            badge={
              formattedPreview ? (
                <span className="text-[11px] font-semibold text-brand-blue bg-brand-blue-50 px-2 py-0.5 rounded-md border border-brand-blue-100">
                  {formattedPreview}
                </span>
              ) : undefined
            }
          >
            {label}
          </Label>
        )}
        {inputControl}
        {error && <FieldError id={errorId} message={error} />}
        {helperText && !error && <FieldHelper id={helperId} text={helperText} />}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

