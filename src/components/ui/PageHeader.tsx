import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  badgeText?: string;
  title: string;
  description?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  eyebrow,
  badgeText,
  title,
  description,
  subtitle,
  icon,
  action,
  children,
}: PageHeaderProps) {
  const badge = badgeText || eyebrow;
  const desc = description || subtitle;
  const rightAction = children || action;

  return (
    <header className="relative flex flex-col gap-4 overflow-hidden rounded-[2rem] border border-white/70 bg-white/45 p-5 shadow-[0_16px_40px_rgba(23,45,80,0.06)] backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between sm:p-7">
      <div>
        {badge && (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-100/80 bg-blue-50/75 px-3 py-1 text-xs font-semibold text-brand-blue">
            {icon}
            {badge}
          </div>
        )}
        <h1 className="text-2xl font-black tracking-tight text-brand-navy sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-slate-500">{desc}</p>}
      </div>
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />
      {rightAction && <div className="z-10 shrink-0">{rightAction}</div>}
    </header>
  );
}
