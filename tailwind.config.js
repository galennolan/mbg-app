/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            DEFAULT: '#1565C0',
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#7CC4FA',
            400: '#38A3F8',
            500: '#1E88E5',
            600: '#1565C0',
            700: '#0D47A1',
            800: '#0A357A',
            900: '#072454',
          },
          navy: {
            DEFAULT: '#0D3B7A',
            dark: '#082552',
            light: '#1652A3',
            muted: '#1E4985',
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
        surface: {
          canvas: 'var(--surface-canvas)',
          card: 'var(--surface-card)',
          subtle: 'var(--accent-muted)',
          muted: 'var(--accent-muted)',
          border: 'var(--surface-border)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
      },
      zIndex: {
        dropdown: '20',
        sticky: '30',
        'bottom-nav': '40',
        overlay: '45',
        modal: '50',
        toast: '60',
        sweetalert: '70',
      },
      boxShadow: {
        'elev-1': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'elev-2': '0 2px 6px -1px rgba(23, 45, 80, 0.06), 0 1px 2px -1px rgba(23, 45, 80, 0.04)',
        'elev-3': '0 6px 16px -3px rgba(23, 45, 80, 0.08), 0 2px 6px -2px rgba(23, 45, 80, 0.04)',
        'elev-4': '0 12px 28px -6px rgba(23, 45, 80, 0.12), 0 4px 10px -3px rgba(23, 45, 80, 0.05)',
        'elev-5': '0 20px 44px -10px rgba(15, 23, 42, 0.22), 0 8px 16px -6px rgba(15, 23, 42, 0.1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'sheet-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.88)' },
          '70%': { opacity: '1', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'shake-error': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slide-up 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        'sheet-up': 'sheet-up 260ms cubic-bezier(0.22, 1, 0.36, 1)',
        'pop-in': 'pop-in 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'toast-in': 'toast-in 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'shake-error': 'shake-error 240ms ease-in-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
};
