import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type FeedbackTone = 'success' | 'error' | 'warning';

const toneClasses: Record<FeedbackTone, string> = {
  success: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-900 shadow-sm',
  error: 'border-red-200/80 bg-red-50/80 text-red-900 shadow-sm',
  warning: 'border-amber-200/80 bg-amber-50/80 text-amber-900 shadow-sm',
};

interface FeedbackBannerProps {
  tone?: FeedbackTone;
  type?: FeedbackTone;
  children?: ReactNode;
  message?: ReactNode;
  icon?: ReactNode;
  onDismiss?: () => void;
}

export function FeedbackBanner({
  tone,
  type,
  children,
  message,
  icon,
  onDismiss,
}: FeedbackBannerProps) {
  const activeTone = (type || tone || 'success') as FeedbackTone;
  const content = children || message;

  if (!content) return null;

  return (
    <div
      className={`flex items-start justify-between gap-2.5 rounded-2xl border p-4 text-xs sm:text-sm ${toneClasses[activeTone]}`}
    >
      <div className="flex items-start gap-2.5">
        {icon}
        <span>{content}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 text-slate-500 hover:text-slate-800 rounded-lg transition"
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
