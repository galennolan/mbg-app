'use client';

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends HTMLAttributes<HTMLElement> {
  htmlFor?: string;
  required?: boolean;
  badge?: ReactNode;
  as?: 'label' | 'legend' | 'span';
}

export const Label = forwardRef<HTMLElement, LabelProps>(
  ({ children, required, badge, as: Component = 'label', className, ...props }, ref) => {
    return (
      <div className="flex items-center justify-between gap-2">
        <Component
          ref={ref as any}
          className={cn(
            'block text-xs font-bold tracking-wide text-text-primary select-none cursor-pointer',
            className
          )}
          {...props}
        >
          <span>{children}</span>
          {required && (
            <span className="ml-1 text-brand-red font-bold" aria-hidden="true" title="Wajib diisi">
              *
            </span>
          )}
        </Component>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
    );
  }
);

Label.displayName = 'Label';
