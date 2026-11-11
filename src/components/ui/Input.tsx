'use client';

import React, { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from './Label';
import { FieldError, FieldHelper } from './FieldMessage';

export interface BaseFieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  'aria-describedby'?: string;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseFieldProps {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  labelBadge?: ReactNode;
  containerClassName?: string;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      required,
      helperText,
      error,
      leftIcon,
      rightIcon,
      icon,
      loading = false,
      labelBadge,
      className,
      containerClassName,
      id,
      disabled,
      showPasswordToggle = true,
      'aria-describedby': externalDescribedBy,
      type,
      ...props
    },
    ref
  ) => {
    const reactId = useId();
    const inputId =
      id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : `input-${reactId}`);
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const isPasswordField = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    const effectiveType = isPasswordField
      ? showPassword
        ? 'text'
        : 'password'
      : type;

    const shouldShowPasswordToggle =
      isPasswordField && showPasswordToggle && !rightIcon && !icon && !loading;

    const describedByParts = [
      externalDescribedBy,
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ].filter(Boolean);
    const ariaDescribedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    const trailingElement = shouldShowPasswordToggle ? (
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="p-1 rounded-lg text-slate-400 hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-blue/30 transition-colors pointer-events-auto"
        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    ) : (
      rightIcon || icon
    );

    const hasTrailing = !!trailingElement || loading;

    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div
            className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"
            aria-hidden="true"
          >
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          disabled={disabled || loading}
          aria-invalid={!!error || undefined}
          aria-required={required || undefined}
          aria-describedby={ariaDescribedBy}
          className={cn(
            'w-full min-h-[44px] bg-surface-card border border-slate-300 rounded-xl text-sm sm:text-base text-text-primary placeholder-slate-400',
            'px-3.5 py-2.5 shadow-elev-1 transition-all duration-150',
            'focus:bg-surface-card focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 focus:outline-none',
            'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
            leftIcon && 'pl-10',
            hasTrailing && 'pr-10',
            error && 'border-red-500 focus:border-red-600 focus:ring-red-500/15',
            className
          )}
          {...props}
        />
        {hasTrailing && (
          <div
            className={cn(
              'absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400',
              shouldShowPasswordToggle ? 'pointer-events-auto' : 'pointer-events-none'
            )}
            aria-hidden={shouldShowPasswordToggle ? undefined : 'true'}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-brand-blue" /> : trailingElement}
          </div>
        )}
      </div>
    );

    if (!label && !error && !helperText) {
      return inputElement;
    }

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <Label htmlFor={inputId} required={required} badge={labelBadge}>
            {label}
          </Label>
        )}
        {inputElement}
        {error && <FieldError id={errorId} message={error} />}
        {helperText && !error && <FieldHelper id={helperId} text={helperText} />}
      </div>
    );
  }
);

Input.displayName = 'Input';

