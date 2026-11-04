import type { ReactNode } from 'react';

type FeedbackTone = 'success' | 'error' | 'warning';

const toneClasses: Record<FeedbackTone, string> = {
  success: 'border-emerald-200/80 bg-emerald-50/70 text-emerald-800 shadow-sm',
  error: 'border-red-200/80 bg-red-50/70 text-red-800 shadow-sm',
  warning: 'border-amber-200/80 bg-amber-50/70 text-amber-800 shadow-sm',
};

interface FeedbackBannerProps {
  tone: FeedbackTone;
  children: ReactNode;
  icon?: ReactNode;
}

export function FeedbackBanner({ tone, children, icon }: FeedbackBannerProps) {
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl border p-4 text-xs sm:text-sm ${toneClasses[tone]}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
}
