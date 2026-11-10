'use client';

import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant =
  | 'primary'
  | 'navy'
  | 'danger'
  | 'success'
  | 'warning'
  | 'secondary'
  | 'outline'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-blue hover:bg-brand-blue-700 text-white border border-brand-blue-700/20 shadow-elev-2',
  navy:
    'bg-brand-navy hover:bg-brand-navy-light text-white border border-brand-navy-dark/20 shadow-elev-2',
  danger:
    'bg-brand-red hover:bg-brand-red-dark text-white border border-red-800/20 shadow-elev-2',
  success:
    'bg-brand-green hover:bg-brand-green-dark text-white border border-emerald-800/20 shadow-elev-2',
  warning:
    'bg-amber-600 hover:bg-amber-700 text-white border border-amber-800/20 shadow-elev-2',
  secondary:
    'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80',
  outline:
    'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-elev-1',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-700 border border-transparent',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[40px] px-3.5 py-2 text-xs rounded-xl gap-1.5',
  md: 'min-h-[44px] px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2',
  lg: 'min-h-[48px] px-6 py-3.5 text-sm sm:text-base rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center font-bold micro-tap select-none cursor-pointer',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue',
          'disabled:opacity-55 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

