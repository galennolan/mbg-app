'use client';

import React, { type FieldsetHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface FormSectionProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

export function FormSection({
  title,
  description,
  icon,
  action,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <fieldset
      className={cn(
        'micro-card rounded-2xl p-5 sm:p-6 space-y-4 border border-slate-200/90 bg-surface-card',
        className
      )}
      {...props}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-start sm:items-center gap-3">
          {icon && (
            <div
              className="w-10 h-10 rounded-xl bg-brand-blue-50 text-brand-blue border border-brand-blue-100 flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <div>
            <legend className="text-sm sm:text-base font-black text-brand-navy tracking-tight">
              {title}
            </legend>
            {description && (
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

