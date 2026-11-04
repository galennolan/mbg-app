import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, icon, action }: PageHeaderProps) {
  return (
    <header className="relative flex flex-col gap-4 overflow-hidden rounded-[2rem] border border-white/70 bg-white/45 p-5 shadow-[0_16px_40px_rgba(23,45,80,0.06)] backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between sm:p-7">
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-blue-100/80 bg-blue-50/75 px-3 py-1 text-xs font-semibold text-brand-blue">
          {icon}
          {eyebrow}
        </div>
        <h1 className="text-2xl font-black tracking-tight text-brand-navy sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
      </div>
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />
      {action && <div className="z-10 shrink-0">{action}</div>}
    </header>
  );
}
