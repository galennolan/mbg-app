/**
 * Phase 1: Centralized Design Token System
 * Project: Nutri Kampus Hub (MBG & Smart EdTech CRM - UBSI)
 * Aligned with DESIGN.md, antislop-ui (R-01, R-10, R-11, R-12, R-19, R-25, R-29), and ui-ux-pro-max
 */

export const designTokens = {
  colors: {
    brand: {
      blue: {
        DEFAULT: '#1769AA',
        50: '#F0F7FD',
        100: '#E0EFFB',
        200: '#B9DDF7',
        500: '#1976D2',
        600: '#1769AA',
        700: '#125386',
        800: '#0E3E64',
        900: '#0A2B46',
      },
      navy: {
        DEFAULT: '#172D50',
        dark: '#0F1E36',
        light: '#284674',
        muted: '#334155',
      },
      red: {
        DEFAULT: '#C62836',
        light: '#FEE2E2',
        dark: '#991B1B',
      },
      green: {
        DEFAULT: '#21864B',
        light: '#DCFCE7',
        dark: '#166534',
      },
      warning: {
        DEFAULT: '#B45309',
        light: '#FEF3C7',
        dark: '#92400E',
      },
    },
    semantic: {
      success: {
        bg: '#ECFDF5',
        border: '#A7F3D0',
        text: '#065F46',
        icon: '#059669',
      },
      error: {
        bg: '#FEF2F2',
        border: '#FECACA',
        text: '#991B1B',
        icon: '#DC2626',
      },
      warning: {
        bg: '#FFFBEB',
        border: '#FDE68A',
        text: '#92400E',
        icon: '#D97706',
      },
      info: {
        bg: '#F0F7FD',
        border: '#BAE6FD',
        text: '#0E3E64',
        icon: '#1769AA',
      },
    },
    surface: {
      canvas: '#F4F7FB',
      card: '#FFFFFF',
      subtle: '#F8FAFC',
      muted: '#F1F5F9',
      border: '#E2E8F0',
      borderStrong: '#CBD5E1',
      // Capped strictly to 1-2 accent layers (Navbar & Modal Overlay) per R-10
      glassNav: 'rgba(15, 30, 54, 0.92)',
      glassOverlay: 'rgba(15, 23, 42, 0.65)',
    },
  },

  spacing: {
    base: '4px',
    touchMin: '44px', // WCAG / iOS minimum tap target (R-03)
    touchComfort: '48px', // Android Material comfort target
    fieldGap: '6px',
    sectionGap: '24px',
  },

  radii: {
    xs: '0.375rem', // 6px - small inline code/tags
    sm: '0.5rem',   // 8px - status badges (non-pill per R-11)
    md: '0.75rem',  // 12px - compact buttons, inputs, selects
    lg: '1rem',     // 16px - standard form controls, action buttons
    xl: '1.25rem',  // 20px - inner panels, dialogs
    '2xl': '1.5rem', // 24px - primary section cards
    full: '9999px', // Strictly for circular avatars or status dots
  },

  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
    sm: '0 2px 6px -1px rgba(23, 45, 80, 0.06), 0 1px 2px -1px rgba(23, 45, 80, 0.04)',
    md: '0 6px 16px -3px rgba(23, 45, 80, 0.08), 0 2px 6px -2px rgba(23, 45, 80, 0.04)',
    lg: '0 12px 28px -6px rgba(23, 45, 80, 0.12), 0 4px 10px -3px rgba(23, 45, 80, 0.05)',
    xl: '0 20px 44px -10px rgba(15, 23, 42, 0.22), 0 8px 16px -6px rgba(15, 23, 42, 0.1)',
    focus: '0 0 0 3px rgba(23, 105, 170, 0.22)',
    focusError: '0 0 0 3px rgba(220, 38, 38, 0.22)',
  },

  transitions: {
    micro: '150ms cubic-bezier(0.22, 1, 0.36, 1)',
    fast: '180ms cubic-bezier(0.22, 1, 0.36, 1)',
    normal: '240ms cubic-bezier(0.22, 1, 0.36, 1)',
    spring: '320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  zIndex: {
    base: 0,
    dropdown: 20,
    sticky: 30,
    bottomNav: 40,
    overlay: 45,
    modal: 50,
    toast: 60,
    sweetAlert: 70,
  },

  focusRing: {
    width: '2px',
    color: '#1769AA',
    offset: '2px',
    offsetColor: '#FFFFFF',
  },

  breakpoints: {
    xs: '360px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

export type DesignTokens = typeof designTokens;

