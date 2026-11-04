/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: {
            DEFAULT: '#1769AA',
            50: '#F0F7FD',
            100: '#E0EFFB',
            500: '#1976D2',
            600: '#1769AA',
            700: '#125386',
            800: '#0E3E64',
          },
          navy: {
            DEFAULT: '#172D50',
            dark: '#0F1E36',
            light: '#284674',
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
            DEFAULT: '#D97706',
            light: '#FEF3C7',
          }
        }
      }
    },
  },
  plugins: [],
};

