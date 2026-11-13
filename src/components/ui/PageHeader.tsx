'use client';

import React, { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  eyebrow?: string;
  badgeText?: string;
  title: string;
  description?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Standardized PageHeader (Phase 1 & antislop-ui R-01, R-09, R-10, R-12)
 * - Semantic <header> landmark with aria-labelledby
 * - High-contrast solid card surface (no excessive glassmorphism or decorative blurred orbs)
 * - Role/scope context integrated inline rather than a redundant pill parked above the H1
 */
export function PageHeader({
  eyebrow,
  badgeText,
  title,
  description,
  subtitle,
  icon,
  action,
  children,
  className,
}: PageHeaderProps) {
  const reactId = useId();
  const headingId = `page-header-${reactId}`;
  const contextTag = badgeText || eyebrow;
  const desc = description || subtitle;
  const rightAction = children || action;

  return (
    <header
      aria-labelledby={headingId}
      className={cn(
        'micro-card flex flex-col gap-4 rounded-2xl border border-surface-border bg-surface-card p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {icon && (
            <span className="text-brand-blue shrink-0" aria-hidden="true">
              {icon}
            </span>
          )}
          <h1
            id={headingId}
            className="text-xl font-black tracking-tight text-text-primary sm:text-2xl"
          >
            {title}
          </h1>
          {contextTag && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-brand-blue-100 bg-brand-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-blue">
              {contextTag}
            </span>
          )}
        </div>
        {desc && <p className="max-w-2xl text-xs sm:text-sm text-text-secondary leading-relaxed">{desc}</p>}
      </div>

      {rightAction && <div className="shrink-0 flex flex-wrap items-center gap-2">{rightAction}</div>}
    </header>
  );
}
