import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
          dark: '#0f4c2a',
          DEFAULT: '#1a6b3c',
          light: '#2d9e5f',
        },
        card: {
          red: '#dc2626',
          black: '#1c1917',
          bg: '#fffbeb',
          border: '#d4a017',
        },
      },
      backgroundImage: {
        'felt-pattern': "radial-gradient(circle at 50% 50%, #1a6b3c 0%, #0f4c2a 100%)",
        'card-back': "repeating-linear-gradient(45deg, #1e3a8a 0px, #1e3a8a 10px, #1d4ed8 10px, #1d4ed8 20px)",
      },
      keyframes: {
        'card-flip': {
          '0%':   { transform: 'rotateY(0deg) scale(1)' },
          '50%':  { transform: 'rotateY(90deg) scale(1.1)' },
          '100%': { transform: 'rotateY(0deg) scale(1)' },
        },
        'card-move': {
          '0%':   { transform: 'translate(0, 0) scale(1)' },
          '50%':  { transform: 'translate(var(--tx), var(--ty)) scale(1.2)' },
          '100%': { transform: 'translate(var(--tx), var(--ty)) scale(1)' },
        },
        'penalty-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-8px)' },
          '40%':      { transform: 'translateX(8px)' },
          '60%':      { transform: 'translateX(-6px)' },
          '80%':      { transform: 'translateX(6px)' },
        },
        'pile-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(239,68,68,0.4)' },
          '50%':      { boxShadow: '0 0 24px 8px rgba(239,68,68,0.8)' },
        },
        'float-in': {
          '0%':   { opacity: '0', transform: 'translateY(20px) scale(0.8)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
      },
      animation: {
        'card-flip':    'card-flip 0.4s ease-in-out',
        'card-move':    'card-move 0.5s ease-in-out forwards',
        'penalty-shake':'penalty-shake 0.5s ease-in-out',
        'pile-glow':    'pile-glow 1s ease-in-out infinite',
        'float-in':     'float-in 0.3s ease-out',
        'pulse-ring':   'pulse-ring 1s ease-out infinite',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
