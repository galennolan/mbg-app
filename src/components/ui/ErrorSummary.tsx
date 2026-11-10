'use client';

import React, { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ErrorSummaryProps {
  errors: Record<string, string | undefined>;
  fieldLabels?: Record<string, string>;
  title?: string;
  className?: string;
}

export function ErrorSummary({
  errors,
  fieldLabels = {},
  title = 'Mohon periksa kembali isian berikut:',
  className,
}: ErrorSummaryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const entries = Object.entries(errors).filter(([, msg]) => Boolean(msg)) as [string, string][];

  useEffect(() => {
    if (entries.length > 0) {
      containerRef.current?.focus();
    }
  }, [entries.length]);

  if (entries.length === 0) return null;

  const handleJumpToField = (e: React.MouseEvent<HTMLAnchorElement>, fieldKey: string) => {
    e.preventDefault();
    const target =
      document.getElementById(fieldKey) ||
      document.querySelector<HTMLElement>(`[name="${fieldKey}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className={cn(
        'rounded-2xl border border-red-200 bg-red-50/95 p-4 text-xs sm:text-sm text-red-950 shadow-elev-1 animate-shake-error focus:outline-2 focus:outline-red-600',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1.5 flex-1">
          <p className="font-black text-red-900">{title}</p>
          <ul className="list-disc list-inside space-y-1">
            {entries.map(([key, msg]) => (
              <li key={key}>
                <a
                  href={`#${key}`}
                  onClick={(e) => handleJumpToField(e, key)}
                  className="font-semibold text-red-800 underline hover:text-red-950"
                >
                  {fieldLabels[key] ? `${fieldLabels[key]}: ` : ''}
                  {msg}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

