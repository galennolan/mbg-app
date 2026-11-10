'use client';

import React, { type HTMLAttributes } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FieldErrorProps extends HTMLAttributes<HTMLParagraphElement> {
  message?: string;
}

export function FieldError({ message, children, className, id, ...props }: FieldErrorProps) {
  const content = message || children;
  if (!content) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-center gap-1.5 text-xs font-semibold text-red-700 animate-shake-error pt-0.5',
        className
      )}
      {...props}
    >
      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />
      <span>{content}</span>
    </p>
  );
}

export interface FieldHelperProps extends HTMLAttributes<HTMLParagraphElement> {
  text?: string;
}

export function FieldHelper({ text, children, className, id, ...props }: FieldHelperProps) {
  const content = text || children;
  if (!content) return null;

  return (
    <p
      id={id}
      className={cn('flex items-center gap-1 text-xs text-slate-600 pt-0.5', className)}
      {...props}
    >
      <Info className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
      <span>{content}</span>
    </p>
  );
}

