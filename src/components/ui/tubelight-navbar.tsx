'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
  primary?: boolean;
}

export interface NavBarProps {
  items: NavItem[];
  activeUrl?: string;
  onSelect?: (item: NavItem) => void;
  className?: string;
}

export function NavBar({ items, activeUrl, onSelect, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState<string>(items[0]?.name ?? '');
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [lampStyle, setLampStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  // Sync activeTab with activeUrl when route changes
  useEffect(() => {
    if (!items.length) return;
    if (activeUrl) {
      const matched = items.find((item) => item.url === activeUrl);
      if (matched) {
        setActiveTab(matched.name);
        return;
      }
    }
    if (!items.some((i) => i.name === activeTab)) {
      setActiveTab(items[0].name);
    }
  }, [activeUrl, items, activeTab]);

  // Measure active tab position for smooth spring-like sliding tubelight lamp
  useEffect(() => {
    const updateLampPosition = () => {
      const el = itemRefs.current[activeTab];
      if (!el) return;
      setLampStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
        ready: true,
      });
    };

    updateLampPosition();
    window.addEventListener('resize', updateLampPosition);
    return () => window.removeEventListener('resize', updateLampPosition);
  }, [activeTab, items]);

  if (!items.length) return null;

  return (
    <nav
      aria-label="Navigasi utama perangkat seluler"
      className={cn(
        'no-print fixed bottom-0 left-1/2 -translate-x-1/2 z-bottom-nav mb-[max(0.85rem,env(safe-area-inset-bottom))] w-auto max-w-[95vw]',
        className
      )}
    >
      <div
        ref={containerRef}
        className="relative flex items-center gap-1 sm:gap-1.5 rounded-full border border-sky-300/35 bg-gradient-to-r from-[#082552]/95 via-[#0D3B7A]/95 to-[#1565C0]/95 p-1.5 shadow-[0_12px_32px_-4px_rgba(8,37,82,0.65)] backdrop-blur-xl"
      >
        {/* Sliding Tubelight Lamp Indicator (Spring Physics Transition) */}
        {lampStyle.ready && (
          <div
            aria-hidden="true"
            style={{
              transform: `translateX(${lampStyle.left}px)`,
              width: `${lampStyle.width}px`,
            }}
            className="pointer-events-none absolute inset-y-1.5 left-0 z-0 rounded-full border border-sky-300/45 bg-gradient-to-b from-sky-400/25 via-[#1E88E5]/25 to-[#1565C0]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-[transform,width] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)]"
          >
            {/* Tubelight Top Lamp Bar & Multi-layer Ambient Glow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-1 w-8 rounded-t-full bg-gradient-to-r from-sky-300 via-white to-sky-300 shadow-[0_0_10px_#38BDF8]">
              <div className="absolute -left-2 -top-2 h-6 w-12 rounded-full bg-sky-400/45 blur-md" />
              <div className="absolute -top-1 left-0 h-6 w-8 rounded-full bg-sky-300/50 blur-md" />
              <div className="absolute left-2 top-0 h-4 w-4 rounded-full bg-white/60 blur-sm" />
            </div>
          </div>
        )}

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <Link
              key={item.name}
              ref={(el) => {
                itemRefs.current[item.name] = el;
              }}
              href={item.url}
              onClick={() => {
                setActiveTab(item.name);
                onSelect?.(item);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative z-10 flex min-h-[44px] min-w-[58px] sm:min-w-[68px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors duration-200 micro-tap',
                isActive
                  ? 'text-white'
                  : 'text-sky-200/75 hover:text-white'
              )}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  'shrink-0 transition-transform duration-200',
                  isActive
                    ? 'scale-110 text-sky-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.65)]'
                    : 'text-sky-200/80'
                )}
                aria-hidden="true"
              />
              <span className="truncate max-w-[66px] leading-tight tracking-tight">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default NavBar;
