"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type AppBlockTheme = "auto" | "light" | "dark";

export const blockRoot =
  "relative flex h-full w-full overflow-hidden bg-[var(--bjork-bg)] text-[color:var(--bjork-text)] antialiased";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bjork-accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[color:var(--bjork-ring-offset)]";

export function useAppBlockTheme(theme: AppBlockTheme = "auto") {
  const style = React.useMemo<CSSProperties>(() => {
    if (theme === "dark") {
      return { colorScheme: "dark" };
    }
    if (theme === "light") {
      return { colorScheme: "light" };
    }
    return {};
  }, [theme]);

  return { style };
}

export function useBlockReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return reduced;
}

export function useElementWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}

export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState("");

  const announce = useCallback((message: string) => {
    setAnnouncement("");
    setTimeout(() => setAnnouncement(message), 50);
  }, []);

  const region = (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );

  return { announce, region };
}

export interface BlockButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const BlockButton = React.forwardRef<HTMLButtonElement, BlockButtonProps>(
  ({ className, variant = "secondary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[9px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" && "h-8 px-2.5 text-[12.5px]",
          size === "md" && "h-9 px-3.5 text-[13.5px]",
          size === "lg" && "h-10 px-4 text-[14px]",
          variant === "primary" &&
            "bg-[var(--bjork-accent)] text-[color:var(--bjork-accent-foreground)] shadow-[var(--bjork-shadow-soft)] hover:bg-[var(--bjork-accent-hover)]",
          variant === "secondary" &&
            "border border-[color:var(--bjork-border)] bg-[var(--bjork-surface)] text-[color:var(--bjork-text)] shadow-[var(--bjork-shadow-soft)] hover:bg-[var(--bjork-surface-hover)] hover:border-[color:var(--bjork-border-strong)]",
          variant === "ghost" &&
            "text-[color:var(--bjork-text-medium)] hover:bg-[var(--bjork-surface-hover)] hover:text-[color:var(--bjork-text)]",
          focusRing,
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
BlockButton.displayName = "BlockButton";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md" | "lg";
  pressed?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = "md", pressed, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        title={label}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center rounded-[8px] text-[color:var(--bjork-text-medium)] transition-colors duration-150 hover:bg-[var(--bjork-surface-hover)] hover:text-[color:var(--bjork-text)] disabled:cursor-not-allowed disabled:opacity-40 [&>svg]:size-[16px]",
          size === "sm" && "size-7 [&>svg]:size-[14px]",
          size === "md" && "size-8 [&>svg]:size-[16px]",
          size === "lg" && "size-9 [&>svg]:size-[18px]",
          pressed && "bg-[var(--bjork-surface-active)] text-[color:var(--bjork-text)]",
          focusRing,
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

export function InitialsAvatar({
  name,
  size = 28,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = React.useMemo(() => {
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full border border-[color:var(--bjork-border-strong)] bg-[var(--bjork-surface-hover)] font-mono font-medium text-[color:var(--bjork-text)] shadow-[var(--bjork-shadow-soft)]",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function Kbd({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded-[4px] border border-[color:var(--bjork-border)] bg-[var(--bjork-surface)] px-1 font-mono text-[11px] text-[color:var(--bjork-text-soft)] shadow-[var(--bjork-shadow-soft)]",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

export function BlockDrawer({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={label}
        aria-modal="true"
        className="relative z-10 flex h-full w-[280px] max-w-[85vw] flex-col border-r border-[color:var(--bjork-border)] bg-[var(--bjork-panel)] shadow-2xl animate-fade-in"
      >
        {children}
      </div>
    </div>
  );
}
